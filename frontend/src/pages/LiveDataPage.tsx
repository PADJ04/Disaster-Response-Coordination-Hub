import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";

import type { BackProps, RescueCenter, Report } from "../types";
import { getRescueCenters, getReports } from "../api";
import MapDashboard from "../components/MapDashboard";
import NavigatorDashboard from "../components/NavigatorDashboard";
import type { Zone } from "../components/NavigatorDashboard";

// Fix Leaflet Default Icon
const DefaultIcon = L.icon({
	iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
	shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});
L.Marker.prototype.options.icon = DefaultIcon;

const RescueCenterIcon = L.divIcon({
	className: "custom-div-icon",
	html: `<div style="background-color: white; border-radius: 50%; border: 2px solid #d32f2f; width: 32px; height: 32px; display: flex; justify-content: center; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#d32f2f" width="20" height="20"><path d="M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg>
         </div>`,
	iconSize: [32, 32],
	iconAnchor: [16, 16],
	popupAnchor: [0, -16],
});

const ReportIcon = L.divIcon({
	className: "custom-div-icon",
	html: `<div style="background-color: white; border-radius: 50%; border: 2px solid #ff9800; width: 32px; height: 32px; display: flex; justify-content: center; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ff9800" width="20" height="20"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
         </div>`,
	iconSize: [32, 32],
	iconAnchor: [16, 16],
	popupAnchor: [0, -16],
});

export default function LiveDataPage({ onBack }: BackProps) {
	const mapContainer = useRef<HTMLDivElement>(null);
	const mapInstance = useRef<L.Map | null>(null); // To access map later
	const floodLayerRef = useRef<L.LayerGroup | null>(null); // To store and clear flood markers
	const rescueCenterLayerRef = useRef<L.LayerGroup | null>(null);
	const reportsLayerRef = useRef<L.LayerGroup | null>(null);

	const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
	const startMarkerRef = useRef<L.Marker | null>(null);
	const endMarkerRef = useRef<L.Marker | null>(null);
	const routeLineRef = useRef<L.Polyline | null>(null);
	const stateLayersRef = useRef<L.GeoJSON[]>([]);
	const polygonDrawerRef = useRef<L.Draw.Polygon | null>(null);

	const [rescueCenters, setRescueCenters] = useState<RescueCenter[]>([]);
	const [reports, setReports] = useState<Report[]>([]);
	const [showRescueCenters, setShowRescueCenters] = useState(false);
	const [showReports, setShowReports] = useState(false);
	const [togglesOpen, setTogglesOpen] = useState(false);

	const [clickMode, setClickMode] = useState<"start" | "end" | null>(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [zones, setZones] = useState<Zone[]>([]);
	const [floodEvents, setFloodEvents] = useState<any[]>([]);
	const [routeResult, setRouteResult] = useState<{
		dist: string;
		time: string;
	} | null>(null);
	const [profile, setProfile] = useState("car");
	const [isMapReady, setIsMapReady] = useState(false);

	const [infoVisible, setInfoVisible] = useState(true);
	const [dashboardOpen, setDashboardOpen] = useState(false);
	const [navigatorOpen, setNavigatorOpen] = useState(false);

	// Fetch Rescue Centers
	useEffect(() => {
		getRescueCenters()
			.then(setRescueCenters)
			.catch((err) => console.error("Failed to fetch rescue centers:", err));

		getReports()
			.then(setReports)
			.catch((err) => console.error("Failed to fetch reports:", err));
	}, []);

	// Render Rescue Centers and Reports
	useEffect(() => {
		if (!isMapReady || !mapInstance.current) return;

		// --- Rescue Centers ---
		if (!rescueCenterLayerRef.current) {
			rescueCenterLayerRef.current = L.layerGroup();
		} else {
			rescueCenterLayerRef.current.clearLayers();
		}

		rescueCenters.forEach((center) => {
			if (center.latitude && center.longitude) {
				const marker = L.marker([center.latitude, center.longitude], {
					icon: RescueCenterIcon,
				});
				marker.bindPopup(`
                    <div style="min-width: 200px;">
                        <h3 style="font-weight: bold; font-size: 1.1em; margin-bottom: 5px;">${
													center.name
												}</h3>
                        <p style="margin: 0; color: #555;">${center.address}</p>
                        <hr style="margin: 8px 0; border: 0; border-top: 1px solid #eee;" />
                        <div style="font-size: 0.9em;">
                            <p style="margin: 2px 0;"><strong>Capacity:</strong> ${
															center.capacity || "N/A"
														}</p>
                            <p style="margin: 2px 0;"><strong>Contact:</strong> ${
															center.contact || "N/A"
														}</p>
                        </div>
                    </div>
                `);
				rescueCenterLayerRef.current?.addLayer(marker);
			}
		});

		// --- Reports ---
		if (!reportsLayerRef.current) {
			reportsLayerRef.current = L.layerGroup();
		} else {
			reportsLayerRef.current.clearLayers();
		}

		reports.forEach((report) => {
			if (report.latitude && report.longitude) {
				const marker = L.marker([report.latitude, report.longitude], {
					icon: ReportIcon,
				});
				marker.bindPopup(`
					<div style="min-width: 200px;">
						<h3 style="font-weight: bold; font-size: 1.1em; margin-bottom: 5px;">${report.title}</h3>
						<p style="margin: 0; color: #555;">${report.description}</p>
						<hr style="margin: 8px 0; border: 0; border-top: 1px solid #eee;" />
						<div style="font-size: 0.9em;">
							<p style="margin: 2px 0;"><strong>Severity:</strong> ${report.severity}</p>
							<p style="margin: 2px 0;"><strong>Status:</strong> ${report.status}</p>
						</div>
					</div>
				`);
				reportsLayerRef.current?.addLayer(marker);
			}
		});
	}, [rescueCenters, reports, isMapReady]);

	// Toggle Layers based on state
	useEffect(() => {
		if (!mapInstance.current) return;
		const map = mapInstance.current;

		// Rescue Centers
		if (rescueCenterLayerRef.current) {
			if (showRescueCenters) {
				if (!map.hasLayer(rescueCenterLayerRef.current)) {
					map.addLayer(rescueCenterLayerRef.current);
				}
			} else {
				if (map.hasLayer(rescueCenterLayerRef.current)) {
					map.removeLayer(rescueCenterLayerRef.current);
				}
			}
		}

		// Reports
		if (reportsLayerRef.current) {
			if (showReports) {
				if (!map.hasLayer(reportsLayerRef.current)) {
					map.addLayer(reportsLayerRef.current);
				}
			} else {
				if (map.hasLayer(reportsLayerRef.current)) {
					map.removeLayer(reportsLayerRef.current);
				}
			}
		}
	}, [showRescueCenters, showReports, isMapReady]);

	// --- 1. Map Initialization (Preserving existing logic) ---
	useEffect(() => {
		if (!mapContainer.current) return;
		if (mapInstance.current) return;

		// Create Map
		const map = L.map(mapContainer.current, {
			maxBoundsViscosity: 1.0,
			minZoom: 5,
			// scrollWheelZoom: false,
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

		map.on(L.Draw.Event.CREATED, (e: any) => {
			const layer = e.layer;

			// Add to Leaflet LayerGroup
			drawnItemsRef.current.addLayer(layer);

			// Generate a unique ID (Leaflet assigns _leaflet_id internally)
			const layerId = L.Util.stamp(layer);

			// Default Style (Blue/Passable)
			layer.setStyle({ color: "#3388ff", fillOpacity: 0.2 });

			// Update React State
			setZones((prev) => [
				...prev,
				{ id: layerId, name: `Zone ${prev.length + 1}`, isBlocked: true }, // Default to blocked? Or false. Let's say True for convenience.
			]);

			// If default isBlocked: true, set style to Red immediately
			layer.setStyle({ color: "#d32f2f", fillOpacity: 0.4 });

			setIsDrawing(false);
			if (polygonDrawerRef.current) {
				polygonDrawerRef.current.disable();
				polygonDrawerRef.current = null;
			}
			map.doubleClickZoom.enable();
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
					if (!mapInstance.current) return; // Check if map still exists
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

		setIsMapReady(true);

		return () => {
			setIsMapReady(false);
			map.remove();
			mapInstance.current = null;
			floodLayerRef.current = null;
			rescueCenterLayerRef.current = null;
			stateLayersRef.current = [];
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

		// Update the flood event state
		setFloodEvents(events);

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

	// Helper: Create a 500m Square Polygon around a point
	const createBufferPolygon = (lat: number, lng: number) => {
		// Approx 500m in degrees (0.0045 deg is roughly 500m)
		const d = 0.0045;

		// Create 4 corners of a square
		return [
			[lat + d, lng - d], // Top-Left
			[lat + d, lng + d], // Top-Right
			[lat - d, lng + d], // Bottom-Right
			[lat - d, lng - d], // Bottom-Left
		];
	};

	const handleAutoAvoidToggle = (active: boolean) => {
		// 1. If Turning OFF: Clean up auto-zones
		if (!active) {
			// Find all auto zones
			const autoZones = zones.filter((z) => z.isAuto);

			// Remove from Leaflet Map
			autoZones.forEach((z) => {
				const layer = drawnItemsRef.current.getLayer(z.id);
				if (layer) drawnItemsRef.current.removeLayer(layer);
			});

			// Remove from React State
			setZones((prev) => prev.filter((z) => !z.isAuto));
			return;
		}

		// 2. If Turning ON: Generate zones from Flood Data
		if (floodEvents.length === 0) {
			alert("No live flood data available to avoid.");
			return;
		}

		const newZones: Zone[] = [];

		floodEvents.forEach((event) => {
			const { lat, lng } = event.coordinates;

			// Generate Square Coordinates
			const coords = createBufferPolygon(lat, lng);

			// Create Leaflet Polygon
			const poly = L.polygon(coords as any, {
				color: "#ff9800", // Orange color to differentiate
				fillOpacity: 0.3,
				weight: 2,
				dashArray: "5, 5", // Dashed line style
			});

			// Add to Map Layer
			drawnItemsRef.current.addLayer(poly);
			const layerId = L.Util.stamp(poly);

			// Add to List
			newZones.push({
				id: layerId,
				name: `Auto-Avoid: ${event.location_name || "Flood Zone"}`,
				isBlocked: true, // Block by default
				isAuto: true, // Mark as auto-generated
			});
		});

		// Update React State
		setZones((prev) => [...prev, ...newZones]);
	};

	// --- ROUTING ACTIONS ---

	// 1. Toggle Drawing Mode
	const handleDrawToggle = (active: boolean) => {
		if (!mapInstance.current) return;
		const map = mapInstance.current;

		setIsDrawing(active);

		if (active) {
			// 1. Disable map double-click zoom so it doesn't interfere with drawing
			map.doubleClickZoom.disable();

			// 2. Create tool and SAVE to ref
			const drawer = new L.Draw.Polygon(map as any, {
				allowIntersection: false,
				showArea: true,
			});

			drawer.enable();
			polygonDrawerRef.current = drawer;
		} else {
			// 3. Disable the specific instance we saved
			if (polygonDrawerRef.current) {
				polygonDrawerRef.current.disable();
				polygonDrawerRef.current = null;
			}
			map.doubleClickZoom.enable();
		}
	};

	const handleToggleZone = (id: number) => {
		// Update State
		setZones((prev) =>
			prev.map((z) => {
				if (z.id === id) return { ...z, isBlocked: !z.isBlocked };
				return z;
			})
		);

		// Update Leaflet Visuals
		const layer = drawnItemsRef.current.getLayer(id);
		if (layer) {
			// We need to check the *new* state.
			// Since setState is async, we look at the 'zones' logic inverted,
			// OR simpler: just find the zone in current state and flip logic here.
			const currentZone = zones.find((z) => z.id === id);
			const willBlock = !currentZone?.isBlocked;

			(layer as L.Path).setStyle({
				color: willBlock ? "#d32f2f" : "#3388ff",
				fillOpacity: willBlock ? 0.4 : 0.2,
			});
		}
	};

	const handleDeleteZone = (id: number) => {
		// Remove from Leaflet
		const layer = drawnItemsRef.current.getLayer(id);
		if (layer) {
			drawnItemsRef.current.removeLayer(layer);
		}
		// Remove from State
		setZones((prev) => prev.filter((z) => z.id !== id));
	};

	const handleBlockAll = () => {
		setZones((prev) => prev.map((z) => ({ ...z, isBlocked: true })));
		drawnItemsRef.current.eachLayer((layer: any) => {
			layer.setStyle({ color: "#d32f2f", fillOpacity: 0.4 });
		});
	};

	// 4. Clear All (Update existing handleClearZone)
	const handleClearZone = () => {
		drawnItemsRef.current.clearLayers();
		setZones([]); // Clear state
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
			"ch.disable": true,
		};

		// Add Custom Model (The Blocked Zone)
		// Inside handleCalculate...

		const blockedZones = zones.filter((z) => z.isBlocked);

		if (blockedZones.length > 0) {
			const multiPolygonCoordinates: any[] = [];

			blockedZones.forEach((zone) => {
				// Find the actual layer by ID
				const layer = drawnItemsRef.current.getLayer(zone.id);
				if (layer) {
					// @ts-ignore
					const rawLatLngs = layer.getLatLngs();
					const ring = Array.isArray(rawLatLngs[0])
						? rawLatLngs[0]
						: rawLatLngs;
					const coords = ring.map((ll: any) => [ll.lng, ll.lat]);
					coords.push(coords[0]); // Close loop
					multiPolygonCoordinates.push([coords]);
				}
			});

			if (multiPolygonCoordinates.length > 0) {
				body.custom_model = {
					areas: {
						hazard_zones: {
							type: "Feature",
							geometry: {
								type: "MultiPolygon",
								coordinates: multiPolygonCoordinates,
							},
							properties: {},
						},
					},
					priority: [{ if: "in_hazard_zones", multiply_by: 0 }],
				};
			}
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
			// ... (your existing marker removals) ...
			if (startMarkerRef.current)
				mapInstance.current.removeLayer(startMarkerRef.current);
			if (endMarkerRef.current)
				mapInstance.current.removeLayer(endMarkerRef.current);
			if (routeLineRef.current)
				mapInstance.current.removeLayer(routeLineRef.current);

			// Clear layers
			drawnItemsRef.current.clearLayers();

			// ADD THIS: Kill the drawing tool if active
			if (polygonDrawerRef.current) {
				polygonDrawerRef.current.disable();
				polygonDrawerRef.current = null;
			}
			mapInstance.current.doubleClickZoom.enable();
		}
		// ... (rest of your state resets remain the same) ...
		startMarkerRef.current = null;
		endMarkerRef.current = null;
		routeLineRef.current = null;
		setRouteResult(null);
		setClickMode(null);
		setIsDrawing(false);
		// setIsBlockActive(false); // Make sure to reset block status too

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

					<div className="flex flex-wrap items-center gap-2 md:gap-4">
						<div className="relative">
							<button
								onClick={() => setTogglesOpen(!togglesOpen)}
								className={`px-4 py-2 rounded-lg transition-all text-sm font-medium border ${
									togglesOpen
										? "bg-blue-600 text-white border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
										: "bg-slate-800 text-blue-100 border-slate-700 hover:border-blue-500/50"
								}`}
							>
								Toggles
							</button>
							{togglesOpen && (
								<div className="absolute top-full left-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-2 z-[1000]">
									<label className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded cursor-pointer text-blue-100">
										<input
											type="checkbox"
											checked={showRescueCenters}
											onChange={(e) => setShowRescueCenters(e.target.checked)}
											className="rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
										/>
										<span className="text-sm">Rescue Centers</span>
									</label>
									<label className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded cursor-pointer text-blue-100">
										<input
											type="checkbox"
											checked={showReports}
											onChange={(e) => setShowReports(e.target.checked)}
											className="rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
										/>
										<span className="text-sm">Active Reports</span>
									</label>
								</div>
							)}
						</div>

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
						isDrawing={isDrawing}
						zones={zones}
						// Actions
						onDrawToggle={handleDrawToggle}
						onToggleZone={handleToggleZone}
						onDeleteZone={handleDeleteZone}
						onBlockAll={handleBlockAll}
						onClearZone={handleClearZone}
						onSetStart={(active) => setClickMode(active ? "start" : null)}
						onSetEnd={(active) => setClickMode(active ? "end" : null)}
						onCalculate={handleCalculate}
						onReset={handleReset}
						onProfileChange={setProfile}
						onAutoAvoidToggle={handleAutoAvoidToggle}
					/>
				)}

				<div
					ref={mapContainer}
					className="relative w-full h-screen"
				/>
			</div>
		</div>
	);
}
