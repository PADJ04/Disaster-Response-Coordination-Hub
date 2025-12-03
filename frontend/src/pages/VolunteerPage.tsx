import { ArrowRight, HeartHandshake } from 'lucide-react';
import InputGroup from '../components/InputGroup';
import type { BackProps } from '../types';

export default function VolunteerPage({ onBack }: BackProps) {
  return (
    <div className="max-w-3xl mx-auto w-full px-6 animate-slide-up pb-24">
      <button onClick={onBack} className="text-white/50 hover:text-white mb-8 flex items-center gap-2 transition-colors">
        <ArrowRight className="rotate-180 w-4 h-4" /> Back to Monitor
      </button>

      <div className="bg-black/40 backdrop-blur-xl border border-teal-500/30 rounded-3xl p-8 md:p-12 shadow-[0_0_50px_rgba(20,184,166,0.1)]">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-teal-500/20 rounded-2xl">
            <HeartHandshake className="w-10 h-10 text-teal-400" />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white">Join the Corps</h2>
            <p className="text-teal-200/60">Become a planetary guardian today.</p>
          </div>
        </div>

        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup label="Full Name" placeholder="e.g. Sarah Connor" />
            <InputGroup label="Location" placeholder="e.g. New York, USA" />
          </div>
          <InputGroup label="Email Address" type="email" placeholder="you@example.com" />
          
          <div className="space-y-3">
            <label className="text-xs font-bold text-teal-200/80 uppercase tracking-wider">Area of Interest</label>
            <div className="grid grid-cols-2 gap-3">
              {['Reforestation', 'Ocean Cleanup', 'Wildlife', 'Urban Farming'].map(tag => (
                <label key={tag} className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer transition-colors">
                  <input type="checkbox" className="accent-teal-500 w-4 h-4" />
                  <span className="text-sm text-white/80">{tag}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="button" className="w-full py-4 bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl font-bold text-black hover:scale-[1.02] transition-transform shadow-lg shadow-teal-500/20">
            Submit Application
          </button>
        </form>
      </div>
    </div>
  );
}