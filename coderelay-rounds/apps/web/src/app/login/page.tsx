'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Username and Password are required.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed. Invalid username or password.');
      }

      if (data.accessToken) {
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('userAuth', JSON.stringify(data));

        // Backend determines authorized route based on user role
        const role = data.user?.role || 'ORGANIZER';
        if (role === 'ORGANIZER') {
          router.push('/organizer/rounds');
        } else if (role === 'HOST') {
          router.push('/host/display');
        } else if (role === 'JUDGE') {
          router.push('/judge/dashboard');
        } else {
          router.push('/organizer/rounds');
        }
      } else {
        throw new Error('Invalid server response: token missing.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-6 bg-bgApp bg-tech-grid bg-radial-glow">
      {/* Top Bar Navigation */}
      <div className="absolute top-6 left-6 font-mono text-xs text-textMuted">
        <Link href="/" className="hover:text-accentCyan transition-colors flex items-center space-x-2">
          <span>←</span>
          <span>RETURN TO MAIN PORTAL</span>
        </Link>
      </div>

      <div className="w-full max-w-md p-8 rounded-xl bg-bgSurfaceBase/90 border border-borderMedium/80 shadow-[0_0_30px_rgba(0,0,0,0.5)] glass-panel space-y-6">
        {/* Console Header */}
        <div className="space-y-2 text-center border-b border-borderSubtle pb-5">
          <div className="inline-flex items-center space-x-2 text-[10px] font-mono text-accentCyan uppercase tracking-widest bg-bgSurfaceElevated px-3 py-1 rounded border border-accentCyan/20">
            <span className="h-1.5 w-1.5 rounded-full bg-statusWarning animate-status-pulse" />
            <span>ADMINISTRATIVE ACCESS</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-textPrimary font-mono uppercase">
            CODE RELAY // CONSOLE ACCESS
          </h2>
          <p className="text-xs font-mono text-textMuted">
            AUTHORIZED EVENT PERSONNEL ONLY
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-statusDanger/10 border border-statusDanger/40 text-xs font-mono text-statusDanger flex items-start space-x-2">
            <span className="font-bold">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form (No role selector dropdown - backend RBAC authoritative) */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-textSecondary uppercase tracking-wider">
              USERNAME <span className="text-accentCyan">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. organizer"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-bgApp border border-borderMedium focus:border-accentCyan focus:outline-none text-textPrimary font-mono text-sm placeholder:text-textMuted/50 transition-colors"
              disabled={isLoading}
            />
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-textSecondary uppercase tracking-wider">
              PASSWORD <span className="text-accentCyan">*</span>
            </label>
            <input
              type="password"
              placeholder="• • • • • • • •"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-bgApp border border-borderMedium focus:border-accentCyan focus:outline-none text-textPrimary font-mono text-sm placeholder:text-textMuted/50 transition-colors"
              disabled={isLoading}
            />
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-lg bg-accentCyan text-bgApp font-mono font-bold text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(0,210,255,0.25)] hover:shadow-[0_0_30px_rgba(0,210,255,0.4)] disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-bgApp" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>AUTHENTICATING...</span>
              </>
            ) : (
              <span>ACCESS CONSOLE →</span>
            )}
          </button>
        </form>

        {/* Technical Console Footer */}
        <div className="pt-4 border-t border-borderSubtle text-center">
          <p className="text-[10px] font-mono text-textMuted tracking-wider uppercase">
            AUTHORIZED EVENT PERSONNEL ONLY // VIDYANTRA 2026
          </p>
        </div>
      </div>
    </div>
  );
}
