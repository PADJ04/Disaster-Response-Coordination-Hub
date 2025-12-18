import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";

import type { BackProps } from "../types";
import MapDashboard from "../components/MapDashboard";
import NavigatorDashboard from "../components/NavigatorDashboard";

// Fix Leaflet Default Icon
const DefaultIcon = L.icon({
	iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
	shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function LiveDataPage({ onBack }: BackProps) {
	const mapContainer = useRef<HTMLDivElement>(null);
	const mapInstance = useRef<L.Map | null>(null); // To access map later
	const floodLayerRef = useRef<L.LayerGroup | null>(null); // To store and clear flood markers

	const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
	const drawControlRef = useRef<L.Control.Draw | null>(null);
	const startMarkerRef = useRef<L.Marker | null>(null);
	const endMarkerRef = useRef<L.Marker | null>(null);
	const routeLineRef = useRef<L.Polyline | null>(null);
	const blockPolygonRef = useRef<L.Polygon | null>(null);
	const stateLayersRef = useRef<L.GeoJSON[]>([]);

	const [clickMode, setClickMode] = useState<"start" | "end" | null>(null);
	const [isDrawing, setIsDrawing] = useState(false); // <--- Add this
	const [isBlockActive, setIsBlockActive] = useState(false);
	const [routeResult, setRouteResult] = useState<{
		dist: string;
		time: string;
	} | null>(null);
	const [profile, setProfile] = useState("car");

	const [infoVisible, setInfoVisible] = useState(true);
	const [dashboardOpen, setDashboardOpen] = useState(false);
	const [navigatorOpen, setNavigatorOpen] = useState(false);

	// --- 1. Map Initialization (Preserving existing logic) ---
	useEffect(() => {
		if (!mapContainer.current) return;

		const indiaBounds: L.LatLngBoundsExpression = [
			[5, 75],
			[20, 85],
		];

		// Create Map
		const map = L.map(mapContainer.current, {
			maxBounds: indiaBounds,
			maxBoundsViscosity: 1.0,
			minZoom: 5,
		}).setView([18, 80], 4);

		mapInstance.current = map; // Save instance

		// Add Tile Layer
		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			attribution: "© OpenStreetMap contributors",
			maxZoom: 19,
			noWrap: true,
		}).addTo(map);

		// Create a Layer Group for future flood markers
		floodLayerRef.current = L.layerGroup().addTo(map);

		map.addLayer(drawnItemsRef.current);

		const drawControl = new L.Control.Draw({
			draw: {
				polygon: { allowIntersection: false, showArea: true },
				polyline: false,
				rectangle: false,
				circle: false,
				marker: false,
				circlemarker: false,
			},
			edit: { featureGroup: drawnItemsRef.current },
		});
		drawControlRef.current = drawControl;

		// 3. Event: When a Polygon is drawn
		map.on(L.Draw.Event.CREATED, (e: any) => {
			const layer = e.layer;
			drawnItemsRef.current.clearLayers(); // Only 1 zone allowed
			drawnItemsRef.current.addLayer(layer);
			blockPolygonRef.current = layer;

			// Default "Danger" color
			layer.setStyle({ color: "#d32f2f", fillOpacity: 0.2 });

			setIsDrawing(false);
		});

		// Load State Polygons (Your existing code untouched logic-wise)
		const stateFiles = [
			{
				name: "Andhra Pradesh",
				file: "/geojson/states/ANDHRA%20PRADESH_STATE.geojson",
				color: "#d62728",
			},
			{
				name: "Karnataka",
				file: "/geojson/states/KARNATAKA_STATE.geojson",
				color: "#1f77b4",
			},
			{
				name: "Kerala",
				file: "/geojson/states/KERALA_STATE.geojson",
				color: "#2ca02c",
			},
			{
				name: "Tamil Nadu",
				file: "/geojson/states/TAMIL%20NADU_STATE.geojson",
				color: "#ff7f0e",
			},
			{
				name: "Telangana",
				file: "/geojson/states/TELANGANA_STATE.geojson",
				color: "#9467bd",
			},
		];

		stateFiles.forEach((st) => {
			fetch(st.file)
				.then((res) => res.json())
				.then((geo) => {
					const layer = L.geoJSON(geo, {
						style: { color: st.color, weight: 2, fillOpacity: 0.15 },
						onEachFeature: (_, layer) => {
							layer.bindPopup(st.name);
						},
					}).addTo(map);

					// SAVE THE LAYER TO REF
					stateLayersRef.current.push(layer);
				})
				.catch((err) => console.error("Error loading:", st.file, err));
		});

		return () => {
			map.remove();
		};
	}, []);

	// --- NEW EFFECT: Handle Map Clicks for Start/End ---
	useEffect(() => {
		if (!mapInstance.current) return;

		const map = mapInstance.current;

		// Function to handle the click
		const handleClick = (e: L.LeafletMouseEvent) => {
			if (clickMode === "start") {
				if (startMarkerRef.current) map.removeLayer(startMarkerRef.current);
				startMarkerRef.current = L.marker(e.latlng)
					.addTo(map)
					.bindPopup("START")
					.openPopup();
				setClickMode(null); // Reset mode
			} else if (clickMode === "end") {
				if (endMarkerRef.current) map.removeLayer(endMarkerRef.current);
				endMarkerRef.current = L.marker(e.latlng)
					.addTo(map)
					.bindPopup("END")
					.openPopup();
				setClickMode(null); // Reset mode
			}
		};

		// Bind listener
		map.on("click", handleClick);

		// Cleanup listener when clickMode changes
		return () => {
			map.off("click", handleClick);
		};
	}, [clickMode]); // <--- Dependent on clickMode

	// --- NEW EFFECT: Manage Layer Interactions ---
	// If we are drawing or setting points, make State Layers "unclickable"
	// so clicks pass through to the map/draw tool.
	// --- ROBUST INTERACTION MANAGER ---
	// This forces the State Polygons to be "invisible" to mouse clicks
	// when we are drawing or setting points.
	useEffect(() => {
		const shouldDisableStates = isDrawing || clickMode !== null;

		stateLayersRef.current.forEach((geoJsonGroup) => {
			// L.GeoJSON is a Group, so we must iterate its children (the actual polygons)
			geoJsonGroup.eachLayer((layer: any) => {
				if (shouldDisableStates) {
					// 1. Tell Leaflet it's not interactive
					if (layer.setStyle) layer.setStyle({ interactive: false });

					// 2. FORCE browser to ignore clicks using CSS (The real fix)
					if (layer.getElement()) {
						layer.getElement().classList.add("pointer-events-none");
						layer.getElement().style.pointerEvents = "none"; // Fallback
					}

					// 3. Close any open popups immediately
					layer.closePopup();
				} else {
					// Re-enable everything
					if (layer.setStyle) layer.setStyle({ interactive: true });

					if (layer.getElement()) {
						layer.getElement().classList.remove("pointer-events-none");
						layer.getElement().style.pointerEvents = "auto";
					}
				}
			});
		});
	}, [isDrawing, clickMode]);

	// --- 2. Handle New Data from Dashboard ---
	const handleFloodData = (events: any[]) => {
		if (!mapInstance.current || !floodLayerRef.current) return;

		// Clear previous flood markers
		floodLayerRef.current.clearLayers();

		if (events.length === 0) return;

		// Add new markers
		events.forEach((event) => {
			const { lat, lng } = event.coordinates;

			// Using CircleMarker to look like a "polygon" point
			const circle = L.circleMarker([lat, lng], {
				radius: 8,
				fillColor: "#ef4444", // Red-500
				color: "#fff",
				weight: 2,
				opacity: 1,
				fillOpacity: 0.8,
			});

			const popupContent = `
                <div class="font-sans">
                    <h3 class="font-bold text-sm mb-1">${
											event.location_name
										}</h3>
                    <p class="text-xs text-gray-600 mb-1">${event.context}</p>
                    <span class="text-[10px] font-bold text-white px-2 py-0.5 rounded ${
											event.severity === "High" ? "bg-red-500" : "bg-orange-400"
										}">
                        ${event.severity} SEVERITY
                    </span>
                </div>
            `;

			circle.bindPopup(popupContent);
			floodLayerRef.current?.addLayer(circle);
		});

		// Fly to the first result to show the user where data appeared
		const first = events[0];
		mapInstance.current.flyTo(
			[first.coordinates.lat, first.coordinates.lng],
			9,
			{
				duration: 1.5,
			}
		);
	};

	// --- ROUTING ACTIONS ---

	// 1. Toggle Drawing Mode
	const handleDrawToggle = (active: boolean) => {
		if (!mapInstance.current || !drawControlRef.current) return;

		setIsDrawing(active); // <--- This triggers the Effect above

		if (active) {
			new L.Draw.Polygon(
				mapInstance.current as any,
				(drawControlRef.current.options as any).draw.polygon
			).enable();
		} else {
			// Optional: If you want to allow cancelling via button
			// But usually Draw handles its own disable
		}
	};

	// 2. Toggle Hazard Block (Red <-> Green)
	const handleBlockToggle = (active: boolean) => {
		setIsBlockActive(active);
		if (blockPolygonRef.current) {
			blockPolygonRef.current.setStyle({
				color: active ? "#2e7d32" : "#d32f2f", // Green if active, Red if danger
				fillOpacity: active ? 0.4 : 0.2,
			});
		}
	};

	// 3. Clear Hazard Zone
	const handleClearZone = () => {
		drawnItemsRef.current.clearLayers();
		blockPolygonRef.current = null;
		setIsBlockActive(false);
	};

	// 4. Calculate Route (API Call)
	const handleCalculate = async () => {
		if (!startMarkerRef.current || !endMarkerRef.current) {
			alert("Please set Start and End points");
			return;
		}

		const s = startMarkerRef.current.getLatLng();
		const e = endMarkerRef.current.getLatLng();

		// Prepare Request
		const body: any = {
			profile: profile,
			points: [
				[s.lng, s.lat],
				[e.lng, e.lat],
			],
			points_encoded: false,
			"ch.disable": true, // Important for custom models
		};

		// Add Custom Model (The Blocked Zone)
		// Inside handleCalculate...

		if (isBlockActive && blockPolygonRef.current) {
			// 1. Get the raw latlngs
			const rawLatLngs = blockPolygonRef.current.getLatLngs();

			// 2. Cast it to LatLng[][] (Array of rings) and grab the first ring [0]
			// The first ring is the outer boundary of the polygon
			const latlngs = (rawLatLngs as L.LatLng[][])[0];

			// 3. Now .map() will work because TS knows 'latlngs' is an array of objects
			const coords = latlngs.map((ll) => [ll.lng, ll.lat]);

			// Close the polygon loop for GeoJSON validity
			coords.push(coords[0]);

			body.custom_model = {
				areas: {
					block_zone: {
						type: "Feature",
						geometry: { type: "Polygon", coordinates: [coords] },
					},
				},
				priority: [{ if: "in_block_zone", multiply_by: 0 }],
			};
		}

		try {
			const res = await fetch("http://localhost:8989/route", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (!res.ok) throw new Error("Route failed");

			const data = await res.json();

			if (data.paths && data.paths[0]) {
				const path = data.paths[0];

				// Remove old line
				if (routeLineRef.current && mapInstance.current) {
					mapInstance.current.removeLayer(routeLineRef.current);
				}

				// Draw new line
				const coords = path.points.coordinates.map((c: any) => [c[1], c[0]]);
				routeLineRef.current = L.polyline(coords, {
					color: "#1976d2",
					weight: 5,
				}).addTo(mapInstance.current!);

				// Zoom to route
				mapInstance.current?.fitBounds(L.latLngBounds(coords), {
					padding: [50, 50],
				});

				// Update UI
				setRouteResult({
					dist: (path.distance / 1000).toFixed(2) + " km",
					time: (path.time / 60000).toFixed(0) + " min",
				});
			}
		} catch (err) {
			console.error(err);
			alert("Routing Server Error. Is GraphHopper running on port 8989?");
		}
	};

	// 5. Reset All
	const handleReset = () => {
		if (mapInstance.current) {
			if (startMarkerRef.current)
				mapInstance.current.removeLayer(startMarkerRef.current);
			if (endMarkerRef.current)
				mapInstance.current.removeLayer(endMarkerRef.current);
			if (routeLineRef.current)
				mapInstance.current.removeLayer(routeLineRef.current);
			drawnItemsRef.current.clearLayers();
		}
		startMarkerRef.current = null;
		endMarkerRef.current = null;
		routeLineRef.current = null;
		blockPolygonRef.current = null;
		setRouteResult(null);
		setClickMode(null);
		setIsDrawing(false);

		stateLayersRef.current.forEach((l) => l.setStyle({ interactive: true }));
	};

	return (
		<div className="flex-1 flex flex-col w-full h-full mt-20">
			{/* Header */}
			<div className="px-6 md:px-12 py-4 border-b border-blue-500/20 bg-gradient-to-b from-slate-900 to-slate-950">
				<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
					<div className="flex flex-col flex-1">
						{infoVisible ? (
							<>
								<h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
									Live Data
								</h1>
								<p className="text-blue-100/60 mb-2">
									DISASTER RESPONSE COORDINATION HUB
								</p>
								<p className="text-blue-200/80 text-sm md:text-base max-w-xl">
									DRCH services are available in the southern zone of the
									following states:
									<strong>
										{" "}
										Andhra Pradesh, Karnataka, Kerala, Tamil Nadu, and Telangana
									</strong>
									. You can view the exact coverage area highlighted on the map
									below.
								</p>
							</>
						) : (
							<h1 className="text-2xl font-bold text-white">Live Data</h1>
						)}
					</div>

					<div className="flex items-center gap-4">
						<button
							onClick={() => setDashboardOpen(!dashboardOpen)}
							className={`px-4 py-2 rounded-lg transition-all text-sm font-medium border ${
								dashboardOpen
									? "bg-blue-600 text-white border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
									: "bg-slate-800 text-blue-100 border-slate-700 hover:border-blue-500/50"
							}`}
						>
							Analyzer
						</button>

						<button
							onClick={() => setNavigatorOpen(!navigatorOpen)}
							className={`px-4 py-2 rounded-lg transition-all text-sm font-medium border ${
								navigatorOpen
									? "bg-blue-600 text-white border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
									: "bg-slate-800 text-blue-100 border-slate-700 hover:border-blue-500/50"
							}`}
						>
							Navigator
						</button>

						<button
							onClick={onBack}
							className="px-6 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 
                         hover:from-blue-500/30 hover:to-cyan-500/30 
                         border border-blue-400/30 hover:border-blue-300/60 
                         rounded-lg transition-all text-sm font-medium text-blue-100 
                         backdrop-blur-sm"
						>
							Back
						</button>

						<button
							onClick={() => setInfoVisible(!infoVisible)}
							className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 rounded text-sm text-white transition"
						>
							{infoVisible ? "Hide" : "Expand"}
						</button>
					</div>
				</div>
			</div>

			{/* Map Container */}
			<div className="relative flex-1 w-full" style={{ minHeight: "500px" }}>
				{dashboardOpen && (
					<MapDashboard
						onClose={() => setDashboardOpen(false)}
						onFloodDataReceived={handleFloodData}
					/>
				)}
				{navigatorOpen && (
					<NavigatorDashboard
						onClose={() => setNavigatorOpen(false)}
						// Data
						routeResult={routeResult}
						// Actions
						onDrawToggle={handleDrawToggle}
						onBlockToggle={handleBlockToggle}
						onClearZone={handleClearZone}
						onSetStart={(active) => setClickMode(active ? "start" : null)}
						onSetEnd={(active) => setClickMode(active ? "end" : null)}
						onCalculate={handleCalculate}
						onReset={handleReset}
						onProfileChange={setProfile}
						onAutoAvoidToggle={(active) => {
							console.log("Auto-avoid logic would go here", active);
							// Future: Iterate floodLayerRef, get GeoJSONs, add to custom_model
						}}
					/>
				)}

				<div
					ref={mapContainer}
					className="w-full h-full"
					style={{ height: "100%" }}
				/>
			</div>
		</div>
	);
}
