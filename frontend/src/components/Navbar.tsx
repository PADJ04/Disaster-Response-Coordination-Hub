import { useState, useEffect } from 'react';
import { Globe, Menu, X } from 'lucide-react';
import type { TabType } from '../types';

interface NavbarProps {
  setActiveTab: (tab: TabType) => void;
}

export default function Navbar({ setActiveTab }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${scrolled ? 'bg-black/80 backdrop-blur-md border-white/10 py-3' : 'bg-transparent border-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        
        {/* Logo */}
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setActiveTab('home')}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
            <Globe className="w-8 h-8 text-blue-400 relative z-10 animate-pulse-slow" />
          </div>
          <span className="text-xl font-bold tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-white">
            Terra<span className="font-light text-white/70">Monitor</span>
          </span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {['Overview', 'Live Data', 'Missions', 'Community'].map((item) => (
            <button key={item} className="text-sm font-medium text-white/70 hover:text-blue-400 transition-colors uppercase tracking-widest">
              {item}
            </button>
          ))}
          <button className="px-5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full backdrop-blur-sm transition-all text-sm font-medium">
            Login
          </button>
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
        <div className="absolute top-full left-0 w-full bg-black/95 backdrop-blur-xl border-b border-white/10 p-6 md:hidden animate-fade-in-down">
          <div className="flex flex-col gap-6">
            {['Overview', 'Live Data', 'Missions', 'Community'].map((item) => (
              <button key={item} className="text-left text-lg text-white/80 hover:text-blue-400">
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}