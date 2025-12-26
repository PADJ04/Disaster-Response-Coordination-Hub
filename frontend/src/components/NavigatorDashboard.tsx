import { useState, useEffect, useRef } from "react";

export type Zone = {
	id: number;
	name: string;
	isBlocked: boolean;
};

interface NavigatorDashboardProps {
	onClose: () => void;

	// --- Data from Parent ---
	routeResult?: { dist: string; time: string } | null;
	isDrawing: boolean;

	zones: Zone[];

	// --- Actions ---
	onDrawToggle?: (active: boolean) => void;
	onToggleZone?: (id: number) => void;
	onDeleteZone?: (id: number) => void;
	onBlockAll?: () => void;
	onClearZone?: () => void;

	onSetStart?: (active: boolean) => void;
	onSetEnd?: (active: boolean) => void;
	onCalculate?: () => void;
	onReset?: () => void;
	onProfileChange?: (profile: string) => void;
	onAutoAvoidToggle?: (active: boolean) => void;
}

export default function NavigatorDashboard({
	onClose,
	routeResult,
	isDrawing,
	zones,
	onDrawToggle,
	onToggleZone,
	onDeleteZone,
	onBlockAll,
	onClearZone,
	onSetStart,
	onSetEnd,
	onCalculate,
	onReset,
	onProfileChange,
	onAutoAvoidToggle,
}: NavigatorDashboardProps) {
	// --- UI State (Visual Only) ---
	const [isPinned, setIsPinned] = useState(false);
	const [startActive, setStartActive] = useState(false);
	const [endActive, setEndActive] = useState(false);
	const [autoAvoidActive, setAutoAvoidActive] = useState(false);
	const [profile, setProfile] = useState("car");

	// --- Draggable/Resizable Boilerplate ---
	const dashboardRef = useRef<HTMLDivElement>(null);
	const isResizing = useRef(false);
	const initialResize = useRef({ w: 0, h: 0, x: 0, y: 0 });
	const isDragging = useRef(false);
	const dragOffset = useRef({ x: 0, y: 0 });

	const getClientCoords = (e: any) => {
		if (e.touches) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
		return { x: e.clientX, y: e.clientY };
	};

	const handleDragStart = (e: any) => {
		if (isPinned || !dashboardRef.current) return;
		if (e.target.closest("button") || e.target.closest("select")) return;

		isDragging.current = true;
		const rect = dashboardRef.current.getBoundingClientRect();
		const { x, y } = getClientCoords(e);

		dashboardRef.current.style.transform = "none";
		dashboardRef.current.style.left = `${rect.left}px`;
		dashboardRef.current.style.top = `${rect.top}px`;
		dragOffset.current = { x: x - rect.left, y: y - rect.top };
	};

	const handleResizeStart = (e: any) => {
		if (isPinned || !dashboardRef.current) return;
		e.stopPropagation(); // Stop drag from firing

		isResizing.current = true;
		const { x, y } = getClientCoords(e);
		const rect = dashboardRef.current.getBoundingClientRect();

		// Capture starting dimensions and mouse position
		initialResize.current = { w: rect.width, h: rect.height, x, y };

		// Kill transitions for instant feedback
		dashboardRef.current.style.transition = "none";
		document.body.style.cursor = "nwse-resize";
	};

	useEffect(() => {
		const handleMove = (e: any) => {
			if (!dashboardRef.current) return;

			const { x, y } = getClientCoords(e);

			// --- 1. RESIZE LOGIC ---
			if (isResizing.current) {
				e.preventDefault(); // Prevent text selection

				const deltaX = x - initialResize.current.x;
				const deltaY = y - initialResize.current.y;

				// Calculate new dimensions with minimum limits (300px width, 200px height)
				const newWidth = Math.max(300, initialResize.current.w + deltaX);
				const newHeight = Math.max(200, initialResize.current.h + deltaY);

				dashboardRef.current.style.width = `${newWidth}px`;
				dashboardRef.current.style.height = `${newHeight}px`;
				return; // Stop here so we don't drag while resizing
			}

			// --- 2. DRAG LOGIC ---
			if (isDragging.current) {
				e.preventDefault();
				// We use left/top here to match your handleDragStart logic
				dashboardRef.current.style.left = `${x - dragOffset.current.x}px`;
				dashboardRef.current.style.top = `${y - dragOffset.current.y}px`;
			}
		};

		const handleEnd = () => {
			isDragging.current = false;
			isResizing.current = false;
			document.body.style.cursor = ""; // Reset the global cursor

			// Restore smooth transitions for hover effects
			if (dashboardRef.current) {
				dashboardRef.current.style.transition = "";
			}
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
	}, []);

	// --- Button Handlers ---
	const toggleDraw = () => {
		// We now rely on the Prop, not local state
		const newState = !isDrawing;
		if (onDrawToggle) onDrawToggle(newState);
	};

	const toggleStart = () => {
		setStartActive(!startActive);
		setEndActive(false); // Exclusive
		if (onSetStart) onSetStart(!startActive);
	};

	const toggleEnd = () => {
		setEndActive(!endActive);
		setStartActive(false); // Exclusive
		if (onSetEnd) onSetEnd(!endActive);
	};

	const toggleAutoAvoid = () => {
		const newState = !autoAvoidActive;
		setAutoAvoidActive(newState);
		if (onAutoAvoidToggle) onAutoAvoidToggle(newState);
	};

	// --- Clean Reset Handler ---
	const handleReset = () => {
		setStartActive(false);
		setEndActive(false);
		setAutoAvoidActive(false);
		setProfile("car");

		// 2. Trigger Parent Reset
		if (onReset) onReset();
	};

	return (
		<>
			<style>{`
                .custom-dashboard-scroll::-webkit-scrollbar { 
                    width: 5px; 
                }
                .custom-dashboard-scroll::-webkit-scrollbar-track { 
                    background: rgba(15, 23, 42, 0.5); /* Slate-900 */
                    border-radius: 4px; 
                }
                .custom-dashboard-scroll::-webkit-scrollbar-thumb { 
                    background: rgba(6, 182, 212, 0.4); /* Cyan-500 */
                    border-radius: 4px; 
                }
                .custom-dashboard-scroll::-webkit-scrollbar-thumb:hover { 
                    background: rgba(6, 182, 212, 0.7); /* Cyan-500 Hover */
                }
            `}</style>
			<div
				ref={dashboardRef}
				className="fixed bg-slate-900/95 backdrop-blur-md border border-cyan-500/30 rounded-xl shadow-2xl z-[1000] overflow-hidden flex flex-col min-w-[300px] animate-in fade-in zoom-in-95"
				style={{
					left: "20px",
					top: "100px",
					maxHeight: "85vh",
					width: "320px",
					cursor: isPinned ? "default" : "move",
					willChange: "transform",
					transform: "translate3d(0,0,0)",
				}}
			>
				{/* Header */}
				<div
					onMouseDown={handleDragStart}
					onTouchStart={handleDragStart}
					className={`p-4 border-b border-cyan-500/20 flex justify-between items-center bg-slate-950/50 select-none ${
						!isPinned && "hover:bg-slate-800/50"
					}`}
				>
					<div className="flex items-center gap-2">
						<div className="text-red-400 animate-pulse">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
								<path d="M12 9v4" />
								<path d="M12 17h.01" />
							</svg>
						</div>
						<div>
							<h2 className="text-white font-bold text-lg leading-none">
								Disaster Route
							</h2>
							<span className="text-[10px] text-cyan-400 font-mono tracking-wider">
								SECURE PATHFINDER
							</span>
						</div>
					</div>

					<div className="flex gap-2" onMouseDown={(e) => e.stopPropagation()}>
						<button
							onClick={() => setIsPinned(!isPinned)}
							className={`p-1.5 rounded transition ${
								isPinned
									? "bg-cyan-600 text-white"
									: "text-cyan-400 hover:bg-white/10"
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
							>
								<line x1="12" y1="17" x2="12" y2="22"></line>
								<path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
							</svg>
						</button>
						<button
							onClick={onClose}
							className="text-slate-400 hover:text-white hover:bg-red-500/20 rounded p-1.5 transition"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
							>
								<line x1="18" y1="6" x2="6" y2="18"></line>
								<line x1="6" y1="6" x2="18" y2="18"></line>
							</svg>
						</button>
					</div>
				</div>

				{/* Body */}
				<div
					className="p-4 space-y-5 overflow-y-auto custom-dashboard-scroll"
					onMouseDown={(e) => e.stopPropagation()}
				>
					{/* 1. Hazard Zone (Manual) */}
					<div>
						<div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-2 flex justify-between">
							<span>Manual Hazard Zones</span>
							<span className="text-slate-500">Step 1</span>
						</div>

						{/* Draw Button */}
						<div className="mb-3">
							<button
								onClick={toggleDraw}
								className={`w-full flex items-center justify-center gap-2 py-2 rounded font-medium text-xs transition border ${
									isDrawing
										? "bg-cyan-600 border-cyan-500 text-white shadow-[0_0_15px_rgba(8,145,178,0.4)]"
										: "bg-slate-800 border-slate-700 text-cyan-100 hover:bg-slate-700"
								}`}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<path d="M3 3h18v18H3zM12 8l-4 4 4 4M16 12H8" />
								</svg>
								{isDrawing ? "Finish Drawing" : "Draw New Polygon"}
							</button>
						</div>

						{/* Zones List */}
						<div className="space-y-2 mb-3 max-h-[150px] overflow-y-auto pr-1 custom-dashboard-scroll">
							{zones.length === 0 && (
								<div className="text-center py-4 text-slate-500 text-[10px] border border-dashed border-slate-700 rounded">
									No active zones. Draw a polygon to start.
								</div>
							)}

							{zones.map((zone) => (
								<div
									key={zone.id}
									className="flex items-center gap-2 bg-slate-800/50 p-2 rounded border border-slate-700"
								>
									<div className="flex-1">
										<div className="text-xs text-slate-200 font-medium">
											{zone.name}
										</div>
										<div
											className={`text-[9px] ${
												zone.isBlocked ? "text-red-400" : "text-blue-400"
											}`}
										>
											{zone.isBlocked ? "Status: BLOCKED" : "Status: PASSABLE"}
										</div>
									</div>

									{/* Block Toggle */}
									<button
										onClick={() => onToggleZone && onToggleZone(zone.id)}
										className={`p-1.5 rounded transition ${
											zone.isBlocked
												? "bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30"
												: "bg-slate-700 text-slate-400 hover:text-white border border-transparent"
										}`}
										title={zone.isBlocked ? "Unblock" : "Block"}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="14"
											height="14"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
										>
											<circle cx="12" cy="12" r="10" />
											<line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
										</svg>
									</button>

									{/* Delete */}
									<button
										onClick={() => onDeleteZone && onDeleteZone(zone.id)}
										className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-slate-700 transition"
										title="Remove Zone"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="14"
											height="14"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
										>
											<polyline points="3 6 5 6 21 6"></polyline>
											<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
										</svg>
									</button>
								</div>
							))}
						</div>

						{/* Bulk Actions */}
						{zones.length > 0 && (
							<div className="grid grid-cols-2 gap-2">
								<button
									onClick={onBlockAll}
									className="py-1.5 bg-red-900/30 border border-red-500/30 text-red-200 text-[10px] rounded hover:bg-red-900/50 transition"
								>
									Block All
								</button>
								<button
									onClick={onClearZone}
									className="py-1.5 bg-slate-800 border border-slate-700 text-slate-400 text-[10px] rounded hover:bg-slate-700 transition"
								>
									Clear All
								</button>
							</div>
						)}
					</div>

					<div className="h-px bg-slate-700/50"></div>

					{/* 2. Auto-Avoid (The Flood API integration) */}
					<div>
						<div className="flex justify-between items-center mb-2">
							<div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
								Auto-Avoid Floods
							</div>
							<span className="text-[9px] bg-cyan-900/40 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/20">
								Sentinal-1 POWERED
							</span>
						</div>

						<button
							onClick={toggleAutoAvoid}
							className={`w-full flex items-center justify-between px-3 py-2 rounded font-medium text-xs transition border ${
								autoAvoidActive
									? "bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]"
									: "bg-slate-800 border-slate-700 text-indigo-200 hover:bg-slate-700"
							}`}
						>
							<span className="flex items-center gap-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
								</svg>
								Use Real-Time Data
							</span>
							<div
								className={`w-3 h-3 rounded-full border ${
									autoAvoidActive
										? "bg-white border-transparent"
										: "border-indigo-400"
								}`}
							></div>
						</button>
						<p className="text-[10px] text-slate-400 mt-1 leading-tight">
							Uses current flood dashboard markers to automatically reroute.
						</p>
					</div>

					<div className="h-px bg-slate-700/50"></div>

					{/* 3. Route Points */}
					<div>
						<div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-2 flex justify-between">
							<span>Route Planning</span>
							<span className="text-slate-500">Step 2</span>
						</div>
						<div className="grid grid-cols-2 gap-2 mb-2">
							<button
								onClick={toggleStart}
								className={`flex items-center justify-center gap-2 py-2 rounded font-medium text-xs transition border ${
									startActive
										? "bg-green-600 border-green-500 text-white shadow-[0_0_10px_rgba(22,163,74,0.4)]"
										: "bg-slate-800 border-slate-700 text-green-100 hover:bg-slate-700"
								}`}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
									<circle cx="12" cy="10" r="3" />
								</svg>
								{startActive ? "Click Map" : "Set Start"}
							</button>
							<button
								onClick={toggleEnd}
								className={`flex items-center justify-center gap-2 py-2 rounded font-medium text-xs transition border ${
									endActive
										? "bg-blue-600 border-blue-500 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]"
										: "bg-slate-800 border-slate-700 text-blue-100 hover:bg-slate-700"
								}`}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
									<line x1="4" y1="22" x2="4" y2="15" />
								</svg>
								{endActive ? "Click Map" : "Set End"}
							</button>
						</div>

						<select
							value={profile}
							onChange={(e) => {
								setProfile(e.target.value);
								if (onProfileChange) onProfileChange(e.target.value);
							}}
							className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white text-xs mb-3 focus:outline-none focus:border-cyan-500"
						>
							<option value="car">Transport: Emergency Vehicle (Car)</option>
							<option value="foot">Transport: Rescue Team (Foot)</option>
						</select>
					</div>

					{/* 4. Actions */}
					<div className="space-y-2">
						<button
							onClick={onCalculate}
							className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded font-bold text-sm shadow-lg shadow-emerald-900/20 transition flex items-center justify-center gap-2 border border-emerald-500/30"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
							>
								<path d="M9 18l6-6-6-6" />
							</svg>
							Calculate Safe Route
						</button>

						{routeResult && (
							<div className="bg-emerald-900/20 border border-emerald-500/30 rounded p-3 text-center animate-in fade-in">
								<div className="text-[10px] text-emerald-400 uppercase tracking-widest mb-1">
									Estimated Travel
								</div>
								<div className="flex justify-center gap-4 items-baseline">
									<div className="text-xl font-bold text-white">
										{routeResult.dist}
									</div>
									<div className="text-sm font-medium text-emerald-300">
										{routeResult.time}
									</div>
								</div>
							</div>
						)}

						<button
							onClick={handleReset}
							className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium text-xs transition border border-slate-700"
						>
							Reset All
						</button>
					</div>
				</div>
				{!isPinned && (
					<div
						onMouseDown={handleResizeStart}
						onTouchStart={handleResizeStart}
						className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-50 flex items-center justify-center opacity-50 hover:opacity-100 touch-none group"
					>
						{/* Simple Corner Graphic */}
						<svg
							width="6"
							height="6"
							viewBox="0 0 6 6"
							className="text-cyan-500/80 group-hover:text-cyan-400"
						>
							<path d="M6 6L0 6L6 0Z" fill="currentColor" />
						</svg>
					</div>
				)}
			</div>
		</>
	);
}
