import { AlertCircle, Users, Building2, MapPin } from 'lucide-react';
import HudCard from '../components/HudCard';
import type { NavigationProps } from '../types';

export default function HomePage({ onNavigate }: NavigationProps) {
  return (
    <div className="flex-1 flex flex-col justify-center px-6 md:px-12 animate-fade-in">
      
      {/* Hero Text */}
      <div className="w-full text-center mt-10 md:mt-5 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold tracking-widest uppercase mb-6 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
          System Online
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 tracking-wide leading-relaxed mb-6">
          <div className="block">DISASTER RESPONSE</div>
          <div className="block">COORDINATION</div>
          <div className="block"><span className="text-blue-500">HUB</span></div>
        </h1>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-blue-100/60 max-w-2xl mx-auto leading-relaxed">
          Coordinate emergency response efforts. Connect volunteers, manage rescue centers, and track incident reports in real-time.
        </p>
      </div>

      {/* Live Data Button */}
      <div className="w-full text-center mb-12">
        <button
          onClick={() => onNavigate('live-data')}
          className="group relative px-8 py-3 bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 hover:from-blue-600 hover:via-blue-700 hover:to-cyan-600 text-white font-bold rounded-lg transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-blue-500/50 inline-flex items-center gap-2 border border-blue-400/30 hover:border-blue-300/60 backdrop-blur-sm overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-white/10 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <MapPin className="w-5 h-5 group-hover:animate-pulse" />
          <span className="relative">View Live Data</span>
        </button>
      </div>

      {/* Floating HUD Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto w-full mb-12">
        <HudCard 
          icon={<AlertCircle className="text-red-400" />}
          label="Issues Reported"
          value="247"
          trend="+12"
          trendUp={false}
        />
        <HudCard 
          icon={<Users className="text-teal-400" />}
          label="Active Volunteers"
          value="1,842"
          trend="+89"
          trendUp={true}
        />
        <HudCard 
          icon={<Building2 className="text-blue-400" />}
          label="Rescue Centers"
          value="34"
          trend="+2"
          trendUp={true}
        />
        <HudCard 
          icon={<MapPin className="text-purple-400" />}
          label="Districts"
          value="12"
          trend="Active"
          trendUp={true}
        />
      </div>
    </div>
  );
}
