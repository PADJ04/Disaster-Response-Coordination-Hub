import { useState } from 'react';
import { LogIn, UserPlus, ArrowLeft } from 'lucide-react';
import type { LoginProps } from '../types';
import api from '../api';

export default function LoginPage({ onNavigate, onLogin }: LoginProps) {
  const [role, setRole] = useState<'district' | 'volunteer' | null>(null);
  const [step, setStep] = useState<'select' | 'credentials'>('select');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (selectedRole: 'district' | 'volunteer') => {
    setRole(selectedRole);
    setError(null);
    setStep('credentials');
  };

  const handleSignIn = async () => {
    setError(null);
    if (!identifier.trim() || !password) {
      setError('Please enter phone/email and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        identifier,
        password,
        role
      });

      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user_id', response.data.user_id);
      localStorage.setItem('role', role as string);
      localStorage.setItem('name', response.data.name || '');

      onLogin(role as 'volunteer' | 'district');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    if (role === 'volunteer') {
      onNavigate('volunteer-signup');
    } else {
      onNavigate('district-signup');
    }
  };

  const roleColor = role === 'district' ? 'blue' : 'teal';
  const borderColor = role === 'district' ? 'border-blue-500/30' : 'border-teal-500/30';
  const shadowColor = role === 'district' ? 'shadow-[0_0_50px_rgba(59,130,246,0.1)]' : 'shadow-[0_0_50px_rgba(20,184,166,0.1)]';
  const gradientFrom = role === 'district' ? 'from-blue-500' : 'from-teal-500';
  const gradientTo = role === 'district' ? 'to-blue-600' : 'to-teal-600';
  const accentColor = role === 'district' ? 'text-blue-400' : 'text-teal-400';
  const bgAccent = role === 'district' ? 'bg-blue-500/20' : 'bg-teal-500/20';
  const iconBg = role === 'district' ? 'bg-blue-500/20' : 'bg-teal-500/20';
  const icon = role === 'district' ? <LogIn className="w-10 h-10 text-blue-400" /> : <UserPlus className="w-10 h-10 text-teal-400" />;

  return (
    <div className="max-w-md mx-auto w-full px-6 animate-slide-up">
      {step === 'select' ? (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-center mb-8">Select Your Role</h2>
          
          <button 
            onClick={() => handleRoleSelect('volunteer')}
            className="w-full p-6 bg-black/40 backdrop-blur-xl border border-teal-500/30 rounded-2xl hover:bg-teal-500/10 transition-all group text-left relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-teal-500/20 rounded-xl">
                <UserPlus className="w-8 h-8 text-teal-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Volunteer</h3>
                <p className="text-teal-200/60 text-sm">Join the response team</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => handleRoleSelect('district')}
            className="w-full p-6 bg-black/40 backdrop-blur-xl border border-blue-500/30 rounded-2xl hover:bg-blue-500/10 transition-all group text-left relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <LogIn className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">District Authority</h3>
                <p className="text-blue-200/60 text-sm">Official command center</p>
              </div>
            </div>
          </button>
        </div>
      ) : (
        <div className={`bg-black/40 backdrop-blur-xl border ${borderColor} rounded-3xl p-8 ${shadowColor}`}>
          <button 
            onClick={() => setStep('select')}
            className="mb-6 text-white/50 hover:text-white flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex items-center gap-4 mb-8">
            <div className={`p-4 ${iconBg} rounded-2xl`}>
              {icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {role === 'district' ? 'Authority Login' : 'Volunteer Login'}
              </h2>
              <p className={`${accentColor} opacity-60`}>Enter your credentials</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/60 uppercase tracking-wider">Phone or Email</label>
              <input 
                type="text" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-white/30 transition-colors"
                placeholder="Enter phone or email"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/60 uppercase tracking-wider">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-white/30 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            <button 
              onClick={handleSignIn}
              disabled={loading}
              className={`w-full py-4 bg-gradient-to-r ${gradientFrom} ${gradientTo} rounded-xl font-bold text-white hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="text-center">
              <button onClick={handleSignUp} className="text-white/40 hover:text-white text-sm transition-colors">
                New here? Create an account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
