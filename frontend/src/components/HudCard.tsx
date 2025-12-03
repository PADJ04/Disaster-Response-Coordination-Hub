import type { HudCardProps } from '../types';

export default function HudCard({ icon, label, value, trend, trendUp }: HudCardProps) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-colors group cursor-default">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-white/5 rounded-lg text-white group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <span className={`text-xs font-mono py-1 px-2 rounded-md ${trendUp ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
          {trend}
        </span>
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-white/40 uppercase tracking-widest font-semibold">{label}</div>
    </div>
  );
}