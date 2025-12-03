import { useState } from 'react';
import type { LoginProps } from '../types';

export default function LoginPage({ onNavigate, onLogin }: LoginProps) {
  const [role, setRole] = useState<'district' | 'volunteer' | null>(null);
  const [step, setStep] = useState<'select' | 'credentials'>('select');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const goToCredentials = () => {
    if (!role) return;
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
    // Mock authentication: accept any non-empty credentials
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);

    // On successful sign-in call onLogin with role
    onLogin(role as 'volunteer' | 'district');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 md:px-12 animate-fade-in">
      <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-xl p-8 backdrop-blur-md">
        <h2 className="text-2xl font-bold mb-4">Sign In</h2>
        {step === 'select' && (
          <>
            <p className="text-sm text-white/70 mb-6">Select your role to continue</p>

            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => setRole('district')}
                className={`w-full text-left p-4 rounded-lg border transition ${role === 'district' ? 'bg-blue-600/30 border-blue-400' : 'bg-white/3 border-white/6'}`}>
                <div className="font-semibold">District Authority</div>
                <div className="text-sm text-white/70">Access reporting and district management tools</div>
              </button>

              <button
                onClick={() => setRole('volunteer')}
                className={`w-full text-left p-4 rounded-lg border transition ${role === 'volunteer' ? 'bg-blue-600/30 border-blue-400' : 'bg-white/3 border-white/6'}`}>
                <div className="font-semibold">Volunteer</div>
                <div className="text-sm text-white/70">View tasks, report observations, and join missions</div>
              </button>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={goToCredentials}
                disabled={!role}
                className="px-4 py-2 bg-blue-500 disabled:opacity-50 rounded-full text-sm font-medium">
                Continue
              </button>

              <button
                onClick={() => onNavigate('home')}
                className="px-4 py-2 bg-transparent border border-white/10 rounded-full text-sm text-white/80">
                Back
              </button>
            </div>
          </>
        )}

        {step === 'credentials' && (
          <>
            <p className="text-sm text-white/70 mb-4">Enter credentials for <span className="font-semibold">{role === 'district' ? 'District Authority' : 'Volunteer'}</span></p>

            <div className="flex flex-col gap-3">
              <input
                value={userId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserId(e.target.value)}
                placeholder="User ID"
                className="w-full p-3 rounded-md bg-white/5 border border-white/10"
              />
              <input
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder="Password"
                type="password"
                className="w-full p-3 rounded-md bg-white/5 border border-white/10"
              />
            </div>

            {error && <div className="text-sm text-red-400 mt-3">{error}</div>}

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleSignIn}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 disabled:opacity-50 rounded-full text-sm font-medium">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <button
                onClick={() => setStep('select')}
                className="px-4 py-2 bg-transparent border border-white/10 rounded-full text-sm text-white/80">
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
