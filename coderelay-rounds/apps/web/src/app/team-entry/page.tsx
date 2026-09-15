'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TeamEntryPage() {
  const router = useRouter();
  const [teamCode, setTeamCode] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!teamCode.trim()) {
      setErrorMessage('TEAM ID is required.');
      return;
    }
    if (!accessCode.trim()) {
      setErrorMessage('ACCESS CODE is required.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/participant/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamCode: teamCode.trim().toUpperCase(),
          accessCode: accessCode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed. Invalid Team ID or Access Code.');
      }

      if (data.accessToken) {
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('teamAuth', JSON.stringify(data));
        router.push('/participant/arena');
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
    <div className="relative flex min-h-screen items-center justify-center p-6 bg-bgApp bg-tech-grid bg-radial-glow select-none">
      {/* Top Navigation */}
      <div className="absolute top-6 left-6 font-mono text-xs text-textMuted">
        <Link href="/" className="hover:text-accentCyan transition-colors flex items-center space-x-2">
          <span>←</span>
          <span>RETURN TO MAIN PORTAL</span>
        </Link>
      </div>

      <div className="w-full max-w-md p-8 rounded-xl bg-bgSurfaceBase/90 border border-borderMedium/80 shadow-[0_0_40px_rgba(0,0,0,0.6)] glass-panel space-y-6">
        {/* Terminal Header */}
        <div className="space-y-2 text-center border-b border-borderSubtle pb-5">
          <div className="text-[10px] font-mono text-accentCyan uppercase tracking-widest bg-accentCyan/10 px-3 py-1 rounded inline-block font-semibold">
            VIDYANTRA 2026 // ACCESS TERMINAL
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-textPrimary font-mono uppercase">
            PARTICIPANT LOGIN
          </h2>
          <p className="text-xs font-mono text-textMuted">
            ENTER ASSIGNED TEAM CREDENTIALS TO ACCESS ARENA
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-statusDanger/10 border border-statusDanger/40 text-xs font-mono text-statusDanger flex items-start space-x-2">
            <span className="font-bold">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Team Access Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Team ID Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-textSecondary uppercase tracking-wider">
              TEAM ID <span className="text-accentCyan">*</span>
            </label>
            <input
              type="text"
              placeholder="CR-001"
              value={teamCode}
              onChange={(e) => setTeamCode(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-bgApp border border-borderMedium focus:border-accentCyan focus:outline-none text-textPrimary font-mono text-sm uppercase tracking-wider placeholder:text-textMuted/40 transition-colors"
              disabled={isLoading}
            />
          </div>

          {/* Access Code Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-textSecondary uppercase tracking-wider">
              ACCESS CODE <span className="text-accentCyan">*</span>
            </label>
            <input
              type="password"
              placeholder="••••••"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-bgApp border border-borderMedium focus:border-accentCyan focus:outline-none text-textPrimary font-mono text-sm tracking-widest placeholder:text-textMuted/40 transition-colors"
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
              <span>VERIFYING ACCESS CODE...</span>
            ) : (
              <span>[ ENTER CODE RELAY ] →</span>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="pt-4 border-t border-borderSubtle text-center">
          <p className="text-[10px] font-mono text-textMuted tracking-wider uppercase">
            SECURE PARTICIPANT TERMINAL // VIDYANTRA 2026
          </p>
        </div>
      </div>
    </div>
  );
}
