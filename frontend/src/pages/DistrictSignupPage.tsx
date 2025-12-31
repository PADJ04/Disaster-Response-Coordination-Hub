import { ArrowRight, Building2 } from 'lucide-react';
import InputGroup from '../components/InputGroup';
import type { BackProps } from '../types';

export default function DistrictSignupPage({ onBack }: BackProps) {
  return (
    <div className="max-w-3xl mx-auto w-full px-6 animate-slide-up pb-24">
      <button onClick={onBack} className="text-white/50 hover:text-white mb-8 flex items-center gap-2 transition-colors">
        <ArrowRight className="rotate-180 w-4 h-4" /> Back to Sign In
      </button>

      <div className="bg-black/40 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-8 md:p-12 shadow-[0_0_50px_rgba(59,130,246,0.1)]">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-blue-500/20 rounded-2xl">
            <Building2 className="w-10 h-10 text-blue-400" />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white">Authority Registration</h2>
            <p className="text-blue-200/60">Register your district administration account.</p>
          </div>
        </div>

        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup label="District Name" placeholder="e.g. Mumbai District" />
            <InputGroup label="Contact Person" placeholder="e.g. John Doe" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup label="Email Address" type="email" placeholder="admin@district.gov" />
            <InputGroup label="Phone Number" placeholder="+91 XXXXX XXXXX" />
          </div>

          <InputGroup label="Official Address" placeholder="Enter district office address" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup label="Username" placeholder="Choose a username" />
            <InputGroup label="Password" type="password" placeholder="Create a strong password" />
          </div>

          <button type="button" className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl font-bold text-white hover:scale-[1.02] transition-transform shadow-lg shadow-blue-500/20">
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}
