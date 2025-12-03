import { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import type { LoginProps } from '../types';

export default function LoginPage({ onNavigate, onLogin }: LoginProps) {
  const [role, setRole] = useState<'district' | 'volunteer' | null>(null);
  const [step, setStep] = useState<'select' | 'credentials'>('select');
  const [userId, setUserId] = useState('');
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
    if (!userId.trim() || !password) {
      setError('Please enter user id and password.');
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);

    onLogin(role as 'volunteer' | 'district');
  };

  const handleSignUp = () => {
    if (role === 'volunteer') {
      onNavigate('volunteer');
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
    <div className="flex-1 flex flex-col items-center justify-center px-6 md:px-12 animate-fade-in">
      <div className={`max-w-md w-full bg-black/40 backdrop-blur-xl border ${borderColor} rounded-3xl p-8 md:p-12 ${shadowColor}`}>
        {step === 'select' && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Access Portal</h2>
              <p className="text-white/60">Select your role to continue</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => handleRoleSelect('district')}
                className="w-full text-left p-6 rounded-2xl border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 transition-all group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition">
                    <LogIn className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="font-bold text-white">District Authority</div>
                </div>
                <div className="text-sm text-blue-200/60 ml-11">Access reporting and district management tools</div>
              </button>

              <button
                onClick={() => handleRoleSelect('volunteer')}
                className="w-full text-left p-6 rounded-2xl border border-teal-500/30 bg-teal-500/5 hover:bg-teal-500/10 transition-all group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-teal-500/20 rounded-lg group-hover:bg-teal-500/30 transition">
                    <UserPlus className="w-5 h-5 text-teal-400" />
                  </div>
                  <div className="font-bold text-white">Volunteer</div>
                </div>
                <div className="text-sm text-teal-200/60 ml-11">View tasks, report observations, and join missions</div>
              </button>
            </div>

            <button
              onClick={() => onNavigate('home')}
              className="w-full mt-6 px-4 py-3 bg-transparent border border-white/10 rounded-xl text-sm font-medium text-white/80 hover:bg-white/5 transition">
              Back to Home
            </button>
          </>
        )}

        {step === 'credentials' && (
          <>
            <div className="flex items-center gap-4 mb-8">
              <div className={`p-4 ${iconBg} rounded-2xl`}>
                {icon}
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white">{role === 'district' ? 'District' : 'Volunteer'} Access</h2>
                <p className={role === 'district' ? 'text-blue-200/60' : 'text-teal-200/60'}>Sign in to your account</p>
              </div>
            </div>

            <div className="space-y-6 mb-6">
              <div>
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block">User ID</label>
                <input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter your user ID"
                  className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 block">Password</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  type="password"
                  className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none transition"
                />
              </div>
            </div>

            {error && <div className="text-sm text-red-400 mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">{error}</div>}

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={handleSignIn}
                disabled={loading}
                className={`py-3 bg-gradient-to-r ${gradientFrom} ${gradientTo} rounded-xl font-bold text-white hover:scale-[1.02] transition-transform disabled:opacity-50 shadow-lg ${role === 'district' ? 'shadow-blue-500/20' : 'shadow-teal-500/20'}`}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <button
                onClick={handleSignUp}
                className={`py-3 bg-gradient-to-r ${gradientFrom} ${gradientTo} rounded-xl font-bold text-white hover:scale-[1.02] transition-transform shadow-lg ${role === 'district' ? 'shadow-blue-500/20' : 'shadow-teal-500/20'}`}>
                Sign Up
              </button>
            </div>

            <button
              onClick={() => {
                setStep('select');
                setRole(null);
                setUserId('');
                setPassword('');
              }}
              className="w-full px-4 py-3 bg-transparent border border-white/10 rounded-xl text-sm font-medium text-white/80 hover:bg-white/5 transition">
              Back to Roles
            </button>
          </>
        )}
      </div>
    </div>
  );
}
