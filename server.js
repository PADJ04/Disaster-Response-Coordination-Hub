import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

// Puppeteer for Stealth Google Search
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import * as cheerio from "cheerio";

dotenv.config();
puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const client = new OpenAI({
	apiKey: process.env.GROQ_API_KEY,
	baseURL: "https://api.groq.com/openai/v1",
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const cleanJsonString = (str) =>
	str
		.replace(/```json/g, "")
		.replace(/```/g, "")
		.trim();

// --- 🧠 SMART GEOCODER ---
// Tries multiple variations to find a match
async function getSmartCoordinates(placeName, district, state) {
	const searchVariations = [
		// 1. Exact Match: "Kattisangavi Bridge, Kalaburagi, Karnataka"
		`${placeName}, ${district}, ${state}, India`,

		// 2. Loose Match (Drop district): "Kattisangavi Bridge, Karnataka"
		`${placeName}, ${state}, India`,

		// 3. Cleaned Name (Remove infrastructure types): "Kattisangavi, Kalaburagi"
		`${placeName
			.replace(/Bridge|Dam|Barrage|Road|Highway|Circle/gi, "")
			.trim()}, ${district}, ${state}, India`,
	];

	for (const query of searchVariations) {
		try {
			// Rate limit compliance
			await sleep(1000);

			const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
				query
			)}&limit=1`;
			const res = await fetch(url, {
				headers: { "User-Agent": "DisasterResponseHub/2.0" },
			});

			if (res.ok) {
				const data = await res.json();
				if (data && data.length > 0) {
					return {
						lat: parseFloat(data[0].lat),
						lng: parseFloat(data[0].lon),
						display_name: data[0].display_name,
					};
				}
			}
		} catch (e) {
			console.log(`     Geocoding error for ${query}`);
		}
	}
	return null;
}

// --- GOOGLE NEWS SCRAPER ---
async function scrapeGoogleNews(query) {
	console.log(`   ↳ 🕵️ Scraper hunting for: "${query}"...`);
	const browser = await puppeteer.launch({
		headless: "new",
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	});
	const page = await browser.newPage();
	let combinedText = "";

	try {
		await page.goto(
			`https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=nws`,
			{ waitUntil: "domcontentloaded" }
		);

		// Get links from Google News
		const $ = cheerio.load(await page.content());
		const links = [];
		$('a[href^="http"]').each((i, el) => {
			const href = $(el).attr("href");
			if (href && !href.includes("google.com") && links.length < 3)
				links.push(href);
		});

		// Read top 3 articles
		for (const link of links) {
			try {
				const newsPage = await browser.newPage();
				await newsPage.goto(link, {
					waitUntil: "domcontentloaded",
					timeout: 15000,
				});
				const body = await newsPage.content();
				const $news = cheerio.load(body);

				// Remove junk
				$("script, style, nav, footer, header").remove();

				let text = "";
				$("p").each((i, el) => {
					const t = $(el).text().trim();
					if (t.length > 60) text += t + "\n";
				});

				combinedText += `\nSOURCE (${link}):\n${text.substring(0, 2000)}\n`;
				await newsPage.close();
			} catch (e) {
				/* skip bad links */
			}
		}
	} catch (error) {
		console.error("   Browser Error:", error.message);
	} finally {
		await browser.close();
	}
	return combinedText;
}

// --- MAIN ROUTE ---
app.post("/api/floods", async (req, res) => {
	try {
		const { state, district, date } = req.body;
		console.log(`\n🌊 ANALYZING: ${district} (${date})...`);

		// 1. Scrape News
		const searchQuery = `villages submerged in ${district} district ${state} flood ${date} list`;
		let context = await scrapeGoogleNews(searchQuery);

		if (!context || context.length < 100) {
			context =
				"Search failed. Use internal knowledge for specific river-bank villages.";
		}

		// 2. AI Extraction (With Strict Rules)
		const systemPrompt = `You are a Strict Data Analyst.
        1. Analyze the text provided.
        2. Extract ONLY locations that are INSIDE ${district} District.
        3. IGNORE locations in neighboring districts (like Raichur, Yadgir, Vijayapura) even if mentioned.
        4. Look for specific village names or bridges (e.g. "Kattisangavi", "Dandoti", "Jewargi bridge").
        5. If the text says "villages along Bhima river in Kalaburagi", list specific major villages you know are there.
        `;

		const userPrompt = `
        NEWS TEXT: 
        ${context}

        TASK: List 5-8 specific flood-hit locations inside ${district} ONLY.
        JSON Output: { "events": [{ "location_name": "Name", "context": "Snippet", "severity": "High" }] }
        `;

		const completion = await client.chat.completions.create({
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: userPrompt },
			],
			model: "llama-3.3-70b-versatile",
			temperature: 0.1,
			response_format: { type: "json_object" },
		});

		// 3. Parse AI Result
		let floodEvents = [];
		try {
			const parsed = JSON.parse(
				cleanJsonString(completion.choices[0].message.content)
			);
			floodEvents = parsed.events || [];
		} catch (e) {
			return res.status(502).json({ error: "AI Parsing Failed" });
		}

		console.log(
			`   ↳ Found names: ${floodEvents.map((e) => e.location_name).join(", ")}`
		);

		// 4. Smart Geocoding
		const results = [];
		for (const event of floodEvents) {
			// Filter out obvious bad matches from AI (Double check)
			if (
				event.location_name.includes("Raichur") ||
				event.location_name.includes("Yadgir")
			)
				continue;

			const coords = await getSmartCoordinates(
				event.location_name,
				district,
				state
			);

			if (coords) {
				results.push({
					...event,
					coordinates: { lat: coords.lat, lng: coords.lng },
					address: coords.display_name,
				});
				process.stdout.write("✅ ");
			} else {
				process.stdout.write("❌ ");
			}
		}

		console.log(`\n✅ Sending ${results.length} verified locations.`);
		res.json({ success: true, data: results });
	} catch (error) {
		console.error("Server Error:", error);
		res.status(500).json({ error: "Internal Error" });
	}
});

app.listen(PORT, () =>
	console.log(`🚀 Smart-Search Server running on port ${PORT}`)
);
