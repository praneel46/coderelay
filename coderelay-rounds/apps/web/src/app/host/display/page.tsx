'use client';

import React, { useState, useEffect } from 'react';

interface LeaderboardEntry {
  rank: number;
  teamId: string;
  teamCode: string;
  teamName: string;
  representativeName: string;
  score: number;
  submittedAt: string | null;
  isQualified: boolean;
}

interface Round2LeaderboardEntry {
  rank: number;
  teamId: string;
  teamCode: string;
  teamName: string;
  currentStageOrder: number;
  activeMemberOrder: number;
  stageStatus: string;
  warningCount: number;
  score: number;
  submittedAt: string | null;
}

export default function HostDisplayPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [hostCodeInput, setHostCodeInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const [activeRound, setActiveRound] = useState<number>(1);
  const [roundState, setRoundState] = useState<string>('WAITING FOR ORGANIZER');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(1200);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [r2Leaderboard, setR2Leaderboard] = useState<Round2LeaderboardEntry[]>([]);
  const [totalTeams, setTotalTeams] = useState<number>(0);
  const [submittedTeams, setSubmittedTeams] = useState<number>(0);

  // Check existing token on mount
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('hostToken') : null;
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // Poll live display state if authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchDisplayData();
    const interval = setInterval(fetchDisplayData, 3000);
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [isAuthenticated]);

  const handleHostAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!hostCodeInput.trim()) {
      setAuthError('Host Access Code is required.');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch('/api/auth/host/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostCode: hostCodeInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid Host Access Code.');
      }

      if (data.accessToken) {
        localStorage.setItem('hostToken', data.accessToken);
        setIsAuthenticated(true);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication error');
    } finally {
      setIsVerifying(false);
    }
  };

  const fetchDisplayData = async () => {
    try {
      const r2Res = await fetch('/api/round2/state');
      if (r2Res.ok) {
        const r2Data = await r2Res.json();
        if (r2Data.roundState && r2Data.roundState !== 'DRAFT') {
          setActiveRound(2);
          setRoundState(r2Data.roundState);
          setRemainingSeconds(r2Data.remainingSeconds || 0);

          const r2BoardRes = await fetch('/api/organizer/round2/leaderboard');
          if (r2BoardRes.ok) {
            const board: Round2LeaderboardEntry[] = await r2BoardRes.json();
            setR2Leaderboard(board);
            setTotalTeams(board.length);
            const subCount = board.filter((b) => b.stageStatus === 'SUBMITTED' || b.currentStageOrder > 1).length;
            setSubmittedTeams(subCount);
          }
          return;
        }
      }

      setActiveRound(1);
      const stateRes = await fetch('/api/round1/state');
      if (stateRes.ok) {
        const data = await stateRes.json();
        setRoundState(data.state || 'WAITING FOR ORGANIZER');
        setRemainingSeconds(data.remainingSeconds || 0);
      }

      const boardRes = await fetch('/api/organizer/round1/leaderboard');
      if (boardRes.ok) {
        const boardData: LeaderboardEntry[] = await boardRes.json();
        setLeaderboard(boardData);
        setTotalTeams(boardData.length);
        const subCount = boardData.filter((b) => b.submittedAt !== null).length;
        setSubmittedTeams(subCount);
      }
    } catch (e) {
      console.error('Display sync error:', e);
    }
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Host Authentication Terminal
  if (!isAuthenticated) {
    return (
      <div className="relative flex min-h-screen items-center justify-center p-6 bg-bgApp bg-tech-grid bg-radial-glow font-mono select-none">
        <div className="w-full max-w-md p-8 rounded-xl bg-bgSurfaceBase/90 border border-borderMedium/80 shadow-[0_0_50px_rgba(0,0,0,0.7)] glass-panel space-y-6">
          <div className="space-y-2 text-center border-b border-borderSubtle pb-5">
            <div className="text-[10px] text-accentCyan font-bold uppercase tracking-widest bg-accentCyan/10 px-3 py-1 rounded inline-block">
              HOST DISPLAY ACCESS
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-textPrimary uppercase">
              ENTER HOST ACCESS CODE
            </h2>
            <p className="text-xs text-textMuted">
              READ-ONLY AUDITORIUM DISPLAY ACCESS
            </p>
          </div>

          {authError && (
            <div className="p-3.5 rounded-lg bg-statusDanger/10 border border-statusDanger/40 text-xs text-statusDanger flex items-start space-x-2">
              <span className="font-bold">⚠️</span>
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleHostAuthSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs text-textSecondary uppercase tracking-wider">
                HOST ACCESS CODE <span className="text-accentCyan">*</span>
              </label>
              <input
                type="password"
                placeholder="• • • • • • • •"
                value={hostCodeInput}
                onChange={(e) => setHostCodeInput(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-bgApp border border-borderMedium focus:border-accentCyan focus:outline-none text-textPrimary font-mono text-center text-lg tracking-widest placeholder:text-textMuted/40 transition-colors"
                disabled={isVerifying}
              />
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3.5 px-4 rounded-lg bg-accentCyan text-bgApp font-mono font-bold text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(0,210,255,0.25)] hover:shadow-[0_0_30px_rgba(0,210,255,0.4)] disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
            >
              {isVerifying ? <span>VERIFYING...</span> : <span>[ ENTER HOST DISPLAY ]</span>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const showResults = roundState === 'QUALIFICATION' || roundState === 'COMPLETE' || roundState === 'SCORING';

  return (
    <div className="min-h-screen bg-bgApp bg-tech-grid bg-radial-glow text-textPrimary flex flex-col justify-between p-8 font-sans select-none overflow-hidden">
      {/* Top Projection Header */}
      <header className="flex items-center justify-between border-b border-borderMedium/80 pb-6 glass-panel px-6 py-4 rounded-xl">
        <div className="flex items-center space-x-4">
          <div className="w-3.5 h-3.5 rounded-full bg-accentCyan animate-ping" />
          <span className="text-sm font-mono text-accentCyan uppercase tracking-widest font-extrabold">
            VIDYANTRA 2026 // ARENA PROJECTION DISPLAY
          </span>
        </div>

        <div className="flex items-center space-x-4 font-mono">
          <span className="px-4 py-1.5 rounded-lg bg-accentCyan/10 border border-accentCyan/30 text-xs font-bold text-accentCyan tracking-wider uppercase glow-cyan-sm">
            ROUND 0{activeRound} ARENA
          </span>
          <span className="px-4 py-1.5 rounded-lg bg-bgSurfaceBase border border-borderMedium text-xs font-bold text-statusSuccess uppercase tracking-wider">
            STATE: {roundState}
          </span>
        </div>
      </header>

      {/* Center Main Auditorium Content */}
      <main className="my-auto py-8 text-center space-y-8">
        <div className="space-y-3">
          <div className="text-sm font-mono text-accentCyan uppercase tracking-widest font-bold">
            {activeRound === 2 ? 'ROUND 2 — TRIPLE STRIKE' : 'ROUND 1 — CODE IQ'}
          </div>
          <h1 className="text-6xl sm:text-8xl md:text-9xl font-black text-textPrimary tracking-tight uppercase drop-shadow-[0_10px_40px_rgba(0,210,255,0.2)] font-mono">
            {activeRound === 2
              ? 'SEQUENTIAL TEAM RELAY'
              : roundState === 'QUALIFICATION' || roundState === 'COMPLETE'
              ? 'QUALIFICATION STANDINGS'
              : 'SPEED MCQ ELIMINATION'}
          </h1>
        </div>

        {/* Large Auditorium Timer Display */}
        <div className="inline-block px-14 py-8 rounded-3xl bg-bgSurfaceBase/95 border-2 border-accentCyan/60 shadow-[0_0_60px_rgba(0,210,255,0.25)] glass-panel">
          <div className="text-8xl sm:text-9xl md:text-[10rem] font-mono font-black text-accentCyan tracking-widest drop-shadow-[0_0_35px_rgba(0,210,255,0.5)]">
            {formatTimer(remainingSeconds)}
          </div>
          <div className="text-xs font-mono text-textMuted uppercase tracking-widest pt-2">
            SERVER-AUTHORITATIVE REMAINING TIME
          </div>
        </div>

        {/* Live Team Progress Bar */}
        <div className="max-w-3xl mx-auto space-y-3 p-6 rounded-xl bg-bgSurfaceBase/80 border border-borderMedium/80 glass-panel">
          <div className="flex justify-between items-center text-xs font-mono text-textMuted">
            <span className="uppercase tracking-wider">COMPETITION TEAM PROGRESS</span>
            <span className="font-bold text-accentCyan uppercase tracking-wider">
              {submittedTeams} / {totalTeams} TEAMS ACTIVE / ADVANCED
            </span>
          </div>

          <div className="w-full h-4 rounded-full bg-bgApp border border-borderSubtle overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-accentCyan via-accentCyanHover to-accentCyan transition-all duration-500 rounded-full shadow-[0_0_15px_rgba(0,210,255,0.5)]"
              style={{
                width: `${totalTeams > 0 ? (submittedTeams / totalTeams) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Results / Leaderboard Screen for Host Display */}
        {showResults && (
          <div className="max-w-5xl mx-auto space-y-4 pt-4">
            <h3 className="text-2xl font-mono font-extrabold text-statusSuccess uppercase tracking-wider">
              🏆 Top Leaderboard Standings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left font-mono">
              {(activeRound === 2 ? r2Leaderboard : leaderboard).slice(0, 10).map((team: any) => (
                <div
                  key={team.teamId}
                  className="p-4 rounded-xl border border-statusSuccess/40 bg-statusSuccess/10 text-textPrimary flex items-center justify-between glass-panel"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-lg bg-bgSurfaceElevated border border-accentCyan/30 flex items-center justify-center font-bold text-accentCyan text-xs">
                      #{team.rank}
                    </span>
                    <div>
                      <div className="font-bold text-sm text-textPrimary">{team.teamCode}</div>
                      <div className="text-xs text-textSecondary">{team.teamName}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-base text-statusSuccess">{team.score} PTS</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="flex flex-col sm:flex-row items-center justify-between border-t border-borderMedium/80 pt-4 text-xs font-mono text-textMuted gap-2">
        <span>VIDYANTRA 2026 // CODE RELAY PLATFORM</span>
        <span>READ-ONLY AUDITORIUM DISPLAY</span>
      </footer>
    </div>
  );
}
