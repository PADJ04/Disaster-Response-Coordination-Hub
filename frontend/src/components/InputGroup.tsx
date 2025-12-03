import type { InputGroupProps } from '../types';

export default function InputGroup({ label, type = "text", placeholder, theme = "teal" }: InputGroupProps) {
  return (
    <div className="space-y-2">
      <label className={`text-xs font-bold uppercase tracking-wider ${theme === 'red' ? 'text-red-200/80' : 'text-teal-200/80'}`}>{label}</label>
      <input 
        type={type} 
        className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none transition-colors ${theme === 'red' ? 'focus:border-red-500/50' : 'focus:border-teal-500/50'}`}
        placeholder={placeholder}
      />
    </div>
  );
}