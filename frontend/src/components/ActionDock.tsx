import { HeartHandshake, AlertTriangle, ArrowRight, ChevronRight } from 'lucide-react';
import type { TabType } from '../types';

interface ActionDockProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function ActionDock({ activeTab, setActiveTab }: ActionDockProps) {
  return (
    <div className="fixed bottom-0 left-0 w-full z-40 p-4 md:p-8 pointer-events-none">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 items-end md:items-center justify-center pointer-events-auto">
        
        {/* Volunteer Button */}
        <button 
          onClick={() => setActiveTab('volunteer')}
          className={`flex-1 w-full md:w-auto group relative overflow-hidden rounded-2xl p-[1px] transition-transform active:scale-95 ${activeTab === 'volunteer' ? 'ring-2 ring-blue-500' : ''}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-blue-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative bg-black/40 backdrop-blur-xl h-full rounded-2xl px-6 py-4 flex items-center justify-between gap-4 group-hover:bg-black/20 transition-colors">
            <div className="flex items-center gap-4">
              <div className="bg-teal-500/20 p-2 rounded-lg">
                <HeartHandshake className="w-6 h-6 text-teal-300" />
              </div>
              <div className="text-left">
                <p className="text-xs text-teal-200 uppercase tracking-wider font-bold">Join the Force</p>
                <p className="text-lg font-bold text-white">Volunteer</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
        </button>

        {/* Report Issue Button */}
        <button 
          onClick={() => setActiveTab('report')}
          className={`flex-1 w-full md:w-auto group relative overflow-hidden rounded-2xl p-[1px] transition-transform active:scale-95 ${activeTab === 'report' ? 'ring-2 ring-red-500' : ''}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-600 opacity-80 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative bg-black/40 backdrop-blur-xl h-full rounded-2xl px-6 py-4 flex items-center justify-between gap-4 group-hover:bg-black/20 transition-colors">
            <div className="flex items-center gap-4">
              <div className="bg-red-500/20 p-2 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-300" />
              </div>
              <div className="text-left">
                <p className="text-xs text-red-200 uppercase tracking-wider font-bold">Observer Alert</p>
                <p className="text-lg font-bold text-white">Report Issue</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
        </button>

      </div>
    </div>
  );
}