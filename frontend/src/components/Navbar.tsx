import { useState, useEffect } from "react";
import { Globe, Menu, X, LogOut } from "lucide-react";
import type { TabType } from "../types";
import { useRef } from "react";

interface NavbarProps {
	setActiveTab: (tab: TabType) => void;
	loggedInRole?: "volunteer" | "district" | null;
	onLogout?: () => void;
}

export default function Navbar({
	setActiveTab,
	loggedInRole,
	onLogout,
}: NavbarProps) {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [scrolled, setScrolled] = useState(false);
	const menuRef = useRef<HTMLDivElement | null>(null);
	const [showLogoutIcon, setShowLogoutIcon] = useState(false);

	// Handle scroll effect
	useEffect(() => {
		const handleScroll = () => setScrolled(window.scrollY > 20);
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	useEffect(() => {
		if (!isMenuOpen) return;

		const handleClickOutside = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setIsMenuOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isMenuOpen]);

	const handleNavClick = (item: string) => {
		if (item === "Live Data") {
			setActiveTab("live-data");
		} else if (item === "Overview") {
			setActiveTab("home");
		} else if (item === "Dashboard") {
			if (loggedInRole === "volunteer") {
				setActiveTab("volunteer-dashboard"); // Now it handles volunteer dashboard
			} else if (loggedInRole === "district") {
				setActiveTab("district-dashboard"); // Now it handles district dashboard
			} else {
				setActiveTab("login"); // If no role, redirect to login
			}
		}
		setIsMenuOpen(false);
	};

	return (
		<nav
			className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${
				scrolled
					? "bg-black/80 backdrop-blur-md border-white/10 py-3"
					: "bg-transparent border-transparent py-6"
			}`}
		>
			<div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
				{/* Logo */}
				<div
					className="flex items-center gap-3 cursor-pointer group"
					onClick={() => setActiveTab("home")}
				>
					<div className="relative">
						<div className="absolute inset-0 bg-blue-500 blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
						<Globe className="w-8 h-8 text-blue-400 relative z-10 animate-pulse-slow" />
					</div>
					<span className="text-xl font-bold tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-white">
						DRCH
					</span>
				</div>

				{/* Desktop Links */}
				<div className="hidden md:flex items-center gap-8">
					{["Overview", "Dashboard", "Live Data"].map((item) => (
						<button
							key={item}
							onClick={() => handleNavClick(item)}
							className="text-sm font-medium text-white/70 hover:text-blue-400 transition-colors uppercase tracking-widest"
						>
							{item}
						</button>
					))}
					{loggedInRole ? (
						<div className="relative flex flex-col items-center">
							{/* Profile Button */}
							<button
								onClick={() => setShowLogoutIcon((prev) => !prev)} // Toggle the logout icon visibility
								className="w-12 h-12 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full backdrop-blur-sm transition-all flex items-center justify-center text-sm font-medium"
							>
								{loggedInRole === "volunteer" ? "V" : "D"}
							</button>

							{/* Show logout icon below profile icon */}
							{showLogoutIcon && (
								<button
									onClick={() => {
										onLogout?.();
										setShowLogoutIcon(false); // Hide the logout icon after logging out
									}}
									className="mt-2 w-8 h-8 bg-red-600 hover:bg-red-700 rounded-full text-white flex items-center justify-center transition-all duration-300 shadow-xl transform scale-110 hover:scale-100"
								>
									<LogOut className="w-5 h-5 text-white" />{" "}
									{/* Larger LogOut icon */}
								</button>
							)}
						</div>
					) : (
						<button
							onClick={() => {
								setActiveTab("login");
								setIsMenuOpen(false);
							}}
							className="px-5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full backdrop-blur-sm transition-all text-sm font-medium"
						>
							Login
						</button>
					)}
				</div>

				{/* Mobile Menu Toggle */}
				<button
					className="md:hidden text-white/80 hover:text-white"
					onClick={() => setIsMenuOpen(!isMenuOpen)}
				>
					{isMenuOpen ? <X /> : <Menu />}
				</button>
			</div>

			{/* Mobile Menu Dropdown */}
			{isMenuOpen && (
				<div className="absolute top-full left-0 w-full md:hidden z-50">
					<div
						ref={menuRef}
						className="mx-4 mt-4 rounded-2xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 
             backdrop-blur-xl border border-blue-500/20 shadow-2xl 
             shadow-blue-500/10 p-4 animate-fade-in-down"
					>
						<div className="flex flex-col gap-3">
							{["Overview", "Dashboard", "Live Data"].map((item) => (
								<button
									key={item}
									onClick={() => handleNavClick(item)}
									className="
              group relative w-full overflow-hidden rounded-xl
              border border-white/10
              bg-white/5 hover:bg-blue-500/10
              px-5 py-4 text-left
              transition-all duration-300
              hover:border-blue-400/40
              hover:shadow-[0_0_25px_rgba(59,130,246,0.25)]
            "
								>
									{/* glow layer */}
									<span
										className="absolute inset-0 opacity-0 group-hover:opacity-100 
                             bg-gradient-to-r from-blue-500/10 to-cyan-500/10 transition-opacity"
									/>

									<span className="relative z-10 text-base font-semibold tracking-wide text-white">
										{item}
									</span>
								</button>
							))}

							<div className="h-px bg-white/10 my-2" />

							{loggedInRole ? (
								<button
									onClick={() => {
										onLogout?.();
										setIsMenuOpen(false);
									}}
									className="
              group relative w-full overflow-hidden rounded-xl
              border border-red-500/20
              bg-red-500/10 hover:bg-red-500/20
              px-5 py-4 text-left
              transition-all duration-300
              hover:shadow-[0_0_25px_rgba(239,68,68,0.35)]
            "
								>
									<span className="relative z-10 text-base font-semibold text-red-400">
										Logout ({loggedInRole === "volunteer" ? "V" : "D"})
									</span>
								</button>
							) : (
								<button
									onClick={() => {
										setActiveTab("login");
										setIsMenuOpen(false);
									}}
									className="
              group relative w-full overflow-hidden rounded-xl
              border border-blue-500/30
              bg-gradient-to-r from-blue-500/20 to-cyan-500/20
              hover:from-blue-500/30 hover:to-cyan-500/30
              px-5 py-4 text-left
              transition-all duration-300
              hover:shadow-[0_0_30px_rgba(59,130,246,0.45)]
            "
								>
									<span className="relative z-10 text-base font-semibold text-white">
										Login
									</span>
								</button>
							)}
						</div>
					</div>
				</div>
			)}
		</nav>
	);
}
