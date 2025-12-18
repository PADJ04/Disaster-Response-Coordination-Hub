// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allows your Vite app to talk to this server
app.use(express.json());

// Initialize OpenAI Client for Groq
const client = new OpenAI({
	apiKey: process.env.GROQ_API_KEY,
	baseURL: "https://api.groq.com/openai/v1",
});

// --- Helper Functions ---

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const cleanJsonString = (str) => {
	return str
		.replace(/```json/g, "")
		.replace(/```/g, "")
		.trim();
};

async function getCoordinates(placeName, district, state) {
	try {
		const query = `${placeName}, ${district}, ${state}, India`;
		const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
			query
		)}&limit=1`;

		const res = await fetch(url, {
			headers: { "User-Agent": "DisasterResponseApp/1.0" },
		});

		if (!res.ok) return null;
		const data = await res.json();

		if (data && data.length > 0) {
			return {
				lat: parseFloat(data[0].lat),
				lng: parseFloat(data[0].lon),
				display_name: data[0].display_name,
			};
		}
		return null;
	} catch (error) {
		console.error(`Geocoding error for ${placeName}:`, error);
		return null;
	}
}

// --- API Route ---

app.post("/api/floods", async (req, res) => {
	try {
		const { state, district, date } = req.body;

		if (!state || !district || !date) {
			return res
				.status(400)
				.json({ error: "Missing state, district, or date" });
		}

		console.log(`Deep Search for: ${district}, ${date}...`);

		// --- 1. Aggressive "Deep Search" Prompt ---
		const completion = await client.chat.completions.create({
			messages: [
				{
					role: "system",
					content: `You are a Forensic Disaster Analyst. 
                    Your job is to identify EXACT locations of historical flood damage.
                    
                    RULES:
                    1. DO NOT return the generic district name (e.g., "Kalaburagi City").
                    2. You MUST list specific Bridges, Villages, Highways, or Landmarks that were submerged.
                    3. Focus on river banks (e.g., Bhima, Krishna, Kagina rivers).
                    4. Return specific names like "Kattisangavi Bridge" or "Dandoti Village".
                    5. Return a valid JSON object only.`,
				},
				{
					role: "user",
					content: `Search deep for flood events in:
                    State: ${state}
                    District: ${district}
                    Timeline: ${date}

                    REQUIRED OUTPUT FORMAT (JSON):
                    { 
                      "events": [
                        { 
                          "location_name": "Specific Name (Bridge/Village)", 
                          "context": "Brief impact (e.g. Submerged by Bhima backwaters)", 
                          "severity": "High" 
                        }
                      ] 
                    }
                    
                    Find at least 5 distinct, specific locations.`,
				},
			],
			// UPDATED MODEL to the new stable version
			model: "llama-3.3-70b-versatile",
			temperature: 0.3, // Slight increase to allow recalling specific village names
			response_format: { type: "json_object" },
		});

		const rawContent = completion.choices[0].message.content;
		let floodEvents = [];

		try {
			const parsed = JSON.parse(cleanJsonString(rawContent));
			if (parsed.events) floodEvents = parsed.events;
			else if (Array.isArray(parsed)) floodEvents = parsed;
		} catch (e) {
			console.error("JSON Parse Error", e);
			return res.status(502).json({ error: "AI response invalid" });
		}

		// --- 2. Geocoding Loop with "Locality" Bias ---
		const results = [];
		const eventsToProcess = floodEvents.slice(0, 8);

		for (const event of eventsToProcess) {
			await sleep(1100);

			// Search Strategy 1: Specific Spot + District
			let coords = await getCoordinates(event.location_name, district, state);

			// Search Strategy 2: If failed, try appending "Village" or "Bridge" explicitly if missing
			if (
				!coords &&
				!event.location_name.includes("Village") &&
				!event.location_name.includes("Bridge")
			) {
				await sleep(1100);
				coords = await getCoordinates(
					`${event.location_name} Village`,
					district,
					state
				);
			}

			if (coords) {
				results.push({
					...event,
					coordinates: { lat: coords.lat, lng: coords.lng },
					address: coords.display_name,
				});
			} else {
				// Only if ALL fails, we skip it (don't show generic city anymore)
				console.log(`Could not pinpoint: ${event.location_name}`);
			}
		}

		res.json({ success: true, data: results });
	} catch (error) {
		console.error("Server Error:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
});
// Start Server
app.listen(PORT, () => {
	console.log(`✅ Backend running on http://localhost:${PORT}`);
});
