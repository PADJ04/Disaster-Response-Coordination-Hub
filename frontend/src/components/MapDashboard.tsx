import React, { useState, useEffect, useRef } from "react";

// Define the shape of data coming from your server
interface FloodEvent {
	location_name: string;
	context: string;
	severity: "High" | "Medium" | "Low";
	coordinates: { lat: number; lng: number };
}

interface MapDashboardProps {
	onClose: () => void;
	// New prop to pass data back to the parent map
	onFloodDataReceived?: (data: FloodEvent[]) => void;
}

export default function MapDashboard({
	onClose,
	onFloodDataReceived,
}: MapDashboardProps) {
	// --- State for Pinning ---
	const [isPinned, setIsPinned] = useState(false);

	// --- State for Search Form ---
	const [formData, setFormData] = useState({
		state: "Karnataka",
		district: "Kalaburagi",
		date: "August 2019",
	});
	const [loading, setLoading] = useState(false);
	const [searchResults, setSearchResults] = useState<FloodEvent[]>([]);

	// --- Refs for Smooth Interaction ---
	const dashboardRef = useRef<HTMLDivElement>(null);

	// Dragging State
	const isDragging = useRef(false);
	const dragOffset = useRef({ x: 0, y: 0 });

	// Resizing State
	const isResizing = useRef(false);
	const initialResize = useRef({ w: 0, h: 0, x: 0, y: 0 });

	// --- Helper to get X/Y from Mouse OR Touch ---
	const getClientCoords = (
		e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent
	) => {
		if ("touches" in e) {
			return { x: e.touches[0].clientX, y: e.touches[0].clientY };
		}
		return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
	};

	// --- Drag Logic ---
	const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
		if (isPinned || !dashboardRef.current || isResizing.current) return;
		if (
			(e.target as HTMLElement).closest("button") ||
			(e.target as HTMLElement).closest("input")
		)
			return;
		if ("touches" in e) e.stopPropagation();

		isDragging.current = true;
		const rect = dashboardRef.current.getBoundingClientRect();
		const { x, y } = getClientCoords(e);

		dashboardRef.current.style.transform = "none";
		dashboardRef.current.style.left = `${rect.left}px`;
		dashboardRef.current.style.top = `${rect.top}px`;

		dragOffset.current = { x: x - rect.left, y: y - rect.top };
		dashboardRef.current.style.cursor = "grabbing";
		dashboardRef.current.style.transition = "none";
	};

	// --- Resize Logic ---
	const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
		if (isPinned || !dashboardRef.current) return;
		e.stopPropagation();
		if ("touches" in e) e.stopPropagation();

		isResizing.current = true;
		const { x, y } = getClientCoords(e);
		const rect = dashboardRef.current.getBoundingClientRect();

		initialResize.current = { w: rect.width, h: rect.height, x: x, y: y };
		dashboardRef.current.style.transition = "none";
		document.body.style.cursor = "nwse-resize";
	};

	// --- Global Events ---
	useEffect(() => {
		const handleMove = (e: MouseEvent | TouchEvent) => {
			if (!dashboardRef.current) return;
			const { x, y } = getClientCoords(e);

			if (isResizing.current) {
				if (e.cancelable) e.preventDefault();
				const deltaX = x - initialResize.current.x;
				const deltaY = y - initialResize.current.y;
				const newWidth = Math.max(
					300,
					Math.min(window.innerWidth * 0.9, initialResize.current.w + deltaX)
				);
				const newHeight = Math.max(
					350,
					Math.min(window.innerHeight * 0.8, initialResize.current.h + deltaY)
				);
				dashboardRef.current.style.width = `${newWidth}px`;
				dashboardRef.current.style.height = `${newHeight}px`;
				return;
			}

			if (isDragging.current) {
				if (e.cancelable) e.preventDefault();
				const newX = x - dragOffset.current.x;
				const newY = y - dragOffset.current.y;
				dashboardRef.current.style.left = `${newX}px`;
				dashboardRef.current.style.top = `${newY}px`;
			}
		};

		const handleEnd = () => {
			if (dashboardRef.current) {
				dashboardRef.current.style.cursor = isPinned ? "default" : "move";
				dashboardRef.current.style.transition = "";
			}
			isDragging.current = false;
			isResizing.current = false;
			document.body.style.cursor = "";
		};

		window.addEventListener("mousemove", handleMove);
		window.addEventListener("mouseup", handleEnd);
		window.addEventListener("touchmove", handleMove, { passive: false });
		window.addEventListener("touchend", handleEnd);

		return () => {
			window.removeEventListener("mousemove", handleMove);
			window.removeEventListener("mouseup", handleEnd);
			window.removeEventListener("touchmove", handleMove);
			window.removeEventListener("touchend", handleEnd);
		};
	}, [isPinned]);

	// --- API CONNECT LOGIC ---
	const handleSearch = async () => {
		setLoading(true);
		setSearchResults([]); // Clear previous
		try {
			// CONNECTING TO YOUR SERVER HERE
			const response = await fetch("http://localhost:5000/api/floods", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			const result = await response.json();

			if (result.success && result.data) {
				setSearchResults(result.data);
				if (onFloodDataReceived) {
					onFloodDataReceived(result.data); // Send to Parent Map
				}
			}
		} catch (error) {
			console.error("Error fetching flood data:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<style>{`
        .custom-dashboard-scroll::-webkit-scrollbar { width: 6px; }
        .custom-dashboard-scroll::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.3); border-radius: 4px; }
        .custom-dashboard-scroll::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.4); border-radius: 4px; }
        .custom-dashboard-scroll::-webkit-scrollbar-thumb:hover { background: rgba(59, 130, 246, 0.7); }
      `}</style>

			<div
				ref={dashboardRef}
				className="fixed bg-slate-900/90 backdrop-blur-md border border-blue-500/30 rounded-xl shadow-2xl z-[1000] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
				style={{
					left: "50%",
					top: "150px",
					transform: "translateX(-50%)",
					width: "384px",
					height: "500px",
					minWidth: "300px",
					minHeight: "300px",
					maxWidth: "95vw",
					maxHeight: "80vh",
					cursor: isPinned ? "default" : "move",
				}}
			>
				{/* Header */}
				<div
					onMouseDown={handleDragStart}
					onTouchStart={handleDragStart}
					className={`flex-shrink-0 p-4 border-b border-blue-500/20 flex justify-between items-center bg-slate-950/50 select-none ${
						!isPinned && "hover:bg-slate-800/50 active:bg-slate-800/80"
					}`}
				>
					<div>
						<h2 className="text-white font-bold text-lg pointer-events-none">
							Map Dashboard
						</h2>
						{/* <p className="text-blue-200/60 text-xs pointer-events-none">
                            AI-Powered Flood Search
                        </p> */}
					</div>

					<div
						className="flex items-center gap-2"
						onMouseDown={(e) => e.stopPropagation()}
						onTouchStart={(e) => e.stopPropagation()}
					>
						<button
							onClick={() => setIsPinned(!isPinned)}
							className={`p-1.5 rounded transition ${
								isPinned
									? "bg-blue-600 text-white shadow-lg shadow-blue-500/40"
									: "text-blue-300 hover:bg-white/10"
							}`}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className={isPinned ? "rotate-45" : ""}
							>
								<line x1="12" y1="17" x2="12" y2="22"></line>
								<path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
							</svg>
						</button>
						<button
							onClick={onClose}
							className="text-blue-200/50 hover:text-white hover:bg-red-500/20 hover:text-red-200 rounded p-1.5 transition"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<line x1="18" y1="6" x2="6" y2="18"></line>
								<line x1="6" y1="6" x2="18" y2="18"></line>
							</svg>
						</button>
					</div>
				</div>

				{/* Content Body */}
				<div
					className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-dashboard-scroll p-4"
					onMouseDown={(e) => e.stopPropagation()}
					onTouchStart={(e) => e.stopPropagation()}
				>
					{/* INPUT FORM */}
					<div className="space-y-3 mb-4 bg-slate-800/30 p-3 rounded-lg border border-blue-500/10">
						<div>
							<label className="text-xs text-blue-300 block mb-1">
								Target Date
							</label>
							<input
								type="text"
								value={formData.date}
								onChange={(e) =>
									setFormData({ ...formData, date: e.target.value })
								}
								className="w-full bg-slate-900 border border-blue-500/30 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
								placeholder="e.g. August 2019"
							/>
						</div>
						<div className="grid grid-cols-2 gap-2">
							<div>
								<label className="text-xs text-blue-300 block mb-1">
									State
								</label>
								<input
									type="text"
									value={formData.state}
									onChange={(e) =>
										setFormData({ ...formData, state: e.target.value })
									}
									className="w-full bg-slate-900 border border-blue-500/30 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
								/>
							</div>
							<div>
								<label className="text-xs text-blue-300 block mb-1">
									District
								</label>
								<input
									type="text"
									value={formData.district}
									onChange={(e) =>
										setFormData({ ...formData, district: e.target.value })
									}
									className="w-full bg-slate-900 border border-blue-500/30 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
								/>
							</div>
						</div>

						<button
							onClick={handleSearch}
							disabled={loading}
							className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium text-sm transition shadow-lg shadow-blue-900/50 flex justify-center items-center mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? (
								<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
							) : (
								"Analyze Data"
							)}
						</button>
					</div>

					<h3 className="text-blue-100/80 text-sm font-semibold mb-3 sticky top-0 bg-slate-900/95 backdrop-blur py-1 z-10">
						Detected Impact Zones
					</h3>

					{/* RESULTS LIST */}
					<div className="space-y-3 pb-4">
						{searchResults.length === 0 && !loading && (
							<div className="text-center py-8 text-blue-200/30 text-xs italic">
								Ready to analyze. Enter details above.
							</div>
						)}

						{searchResults.map((event, idx) => (
							<div
								key={idx}
								className="flex items-start gap-3 bg-slate-800/30 p-2.5 rounded border border-white/5 hover:bg-slate-800/50 transition cursor-pointer group"
							>
								<div
									className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
										event.severity === "High"
											? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
											: event.severity === "Medium"
											? "bg-orange-500"
											: "bg-yellow-500"
									}`}
								/>
								<div className="min-w-0">
									<div className="text-blue-50 text-sm font-medium">
										{event.location_name}
									</div>
									<div className="text-blue-200/60 text-xs mt-0.5 group-hover:text-blue-100 transition leading-snug">
										{event.context}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* RESIZE HANDLE */}
				<div
					onMouseDown={handleResizeStart}
					onTouchStart={handleResizeStart}
					className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize z-50 flex items-center justify-center opacity-50 hover:opacity-100 touch-none"
				>
					<svg
						width="8"
						height="8"
						viewBox="0 0 6 6"
						className="text-blue-400 transform translate-x-[-2px] translate-y-[-2px]"
					>
						<path d="M6 6L0 6L6 0Z" fill="currentColor" />
					</svg>
				</div>
			</div>
		</>
	);
}
