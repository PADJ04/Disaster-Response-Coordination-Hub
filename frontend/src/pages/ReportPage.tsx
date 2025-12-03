import { ArrowRight, AlertTriangle } from 'lucide-react';
import InputGroup from '../components/InputGroup';
import type { BackProps } from '../types';

export default function ReportPage({ onBack }: BackProps) {
  return (
    <div className="max-w-3xl mx-auto w-full px-6 animate-slide-up pb-24">
      <button onClick={onBack} className="text-white/50 hover:text-white mb-8 flex items-center gap-2 transition-colors">
        <ArrowRight className="rotate-180 w-4 h-4" /> Back to Monitor
      </button>

      <div className="bg-black/40 backdrop-blur-xl border border-red-500/30 rounded-3xl p-8 md:p-12 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-red-500/20 rounded-2xl">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white">Report Incident</h2>
            <p className="text-red-200/60">Upload data on environmental hazards.</p>
          </div>
        </div>

        <form className="space-y-6">
          <InputGroup label="Incident Title" placeholder="e.g. Oil Spill Sector 7" theme="red" />
          
          <div className="space-y-3">
            <label className="text-xs font-bold text-red-200/80 uppercase tracking-wider">Severity Level</label>
            <input type="range" className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500" />
            <div className="flex justify-between text-xs text-white/40 font-mono">
              <span>Low</span>
              <span>Critical</span>
            </div>
          </div>

          <div className="space-y-3">
             <label className="text-xs font-bold text-red-200/80 uppercase tracking-wider">Description</label>
             <textarea className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-red-500/50 min-h-[120px]" placeholder="Describe the environmental impact observed..."></textarea>
          </div>

          <button type="button" className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl font-bold text-white hover:scale-[1.02] transition-transform shadow-lg shadow-red-500/20">
            Transmit Report
          </button>
        </form>
      </div>
    </div>
  );
}