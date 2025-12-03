import { Activity, Wind, Thermometer, Users } from 'lucide-react';
import HudCard from '../components/HudCard';
import type { NavigationProps } from '../types';

export default function HomePage({ onNavigate }: NavigationProps) {
  return (
    <div className="flex-1 flex flex-col justify-center px-6 md:px-12 animate-fade-in">
      
      {/* Hero Text */}
      <div className="max-w-4xl mx-auto text-center mt-10 md:mt-20 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold tracking-widest uppercase mb-6 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
          System Online
        </div>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 tracking-tight leading-none mb-6">
          PRESERVE <br />
          THE <span className="text-blue-500">BLUE DOT</span>
        </h1>
        <p className="text-lg md:text-xl text-blue-100/60 max-w-2xl mx-auto leading-relaxed">
          Global environmental monitoring initiative. Connect, contribute, and collaborate to safeguard our planetary ecosystem in real-time.
        </p>
      </div>

      {/* Floating HUD Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto w-full mb-12">
        <HudCard 
          icon={<Activity className="text-green-400" />}
          label="Global Stability"
          value="94.2%"
          trend="+0.4%"
          trendUp={true}
        />
        <HudCard 
          icon={<Wind className="text-blue-400" />}
          label="Air Quality Index"
          value="42 AQI"
          trend="-2.1%"
          trendUp={true}
        />
        <HudCard 
          icon={<Thermometer className="text-orange-400" />}
          label="Avg Temp Anomaly"
          value="+1.2°C"
          trend="+0.1%"
          trendUp={false}
        />
        <HudCard 
          icon={<Users className="text-purple-400" />}
          label="Active Volunteers"
          value="8.2M"
          trend="+124k"
          trendUp={true}
        />
      </div>
    </div>
  );
}