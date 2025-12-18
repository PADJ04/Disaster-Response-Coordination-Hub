import { useState } from 'react';
import { ArrowRight, HeartHandshake } from 'lucide-react';
import type { BackProps } from '../types';
import api from '../api';

export default function VolunteerSignupPage({ onBack }: BackProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
    role: 'volunteer'
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError(null);
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setError("Please fill in all required fields");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/auth/signup', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        password: formData.password,
        confirm_password: formData.confirmPassword,
        role: 'volunteer'
      });
      alert("Signup successful! Please login.");
      onBack();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-6 animate-slide-up pb-24">
      <button onClick={onBack} className="text-white/50 hover:text-white mb-8 flex items-center gap-2 transition-colors">
        <ArrowRight className="rotate-180 w-4 h-4" /> Back to Login
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

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-teal-200/80 uppercase tracking-wider">Full Name</label>
              <input name="name" value={formData.name} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-teal-500/50 transition-colors" placeholder="e.g. Sarah Connor" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-teal-200/80 uppercase tracking-wider">Address</label>
              <input name="address" value={formData.address} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-teal-500/50 transition-colors" placeholder="e.g. New York, USA" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-teal-200/80 uppercase tracking-wider">Email Address</label>
              <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-teal-500/50 transition-colors" placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-teal-200/80 uppercase tracking-wider">Phone Number</label>
              <input name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-teal-500/50 transition-colors" placeholder="+1 234 567 890" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-teal-200/80 uppercase tracking-wider">Password</label>
              <input name="password" type="password" value={formData.password} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-teal-500/50 transition-colors" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-teal-200/80 uppercase tracking-wider">Confirm Password</label>
              <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-teal-500/50 transition-colors" placeholder="••••••••" />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl font-bold text-black hover:scale-[1.02] transition-transform shadow-lg shadow-teal-500/20 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </div>
    </div>
  );
}
