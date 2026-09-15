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
  requiresReview?: boolean;
}

interface Round2Entry {
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

export default function OrganizerRoundsPage() {
  const [round1State, setRound1State] = useState<string>('DRAFT');
  const [round2State, setRound2State] = useState<string>('DRAFT');
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [deadlineAt, setDeadlineAt] = useState<string | null>(null);
  const [qualificationRatio, setQualificationRatio] = useState<number>(0.5);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [round2Leaderboard, setRound2Leaderboard] = useState<Round2Entry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);

  useEffect(() => {
    fetchRound1State();
    fetchRound2State();
    fetchLeaderboard();
    fetchRound2Leaderboard();
  }, []);

  const fetchRound1State = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/round1/state');
      if (res.ok) {
        const data = await res.json();
        setRound1State(data.state);
        setStartedAt(data.startedAt);
        setDeadlineAt(data.deadlineAt);
        if (data.qualificationRatio) setQualificationRatio(data.qualificationRatio);
      }
    } catch (e) {
      console.error('Error loading Round 1 state:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRound2State = async () => {
    try {
      const res = await fetch('/api/round2/state');
      if (res.ok) {
        const data = await res.json();
        setRound2State(data.roundState || data.state || 'DRAFT');
      }
    } catch (e) {
      console.error('Error loading Round 2 state:', e);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/organizer/round1/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (e) {
      console.error('Error loading leaderboard:', e);
    }
  };

  const fetchRound2Leaderboard = async () => {
    try {
      const res = await fetch('/api/organizer/round2/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setRound2Leaderboard(data);
      }
    } catch (e) {
      console.error('Error loading Round 2 leaderboard:', e);
    }
  };

  const handleTransition = async (targetState: string) => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/organizer/round1/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetState, qualificationRatio }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || 'Transition failed');
      } else {
        await fetchRound1State();
        await fetchLeaderboard();
      }
    } catch (e: any) {
      alert(e.message || 'Error executing state transition');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRound2Transition = async (targetState: string) => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/organizer/round2/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetState }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || 'Round 2 transition failed');
      } else {
        await fetchRound2State();
        await fetchRound2Leaderboard();
      }
    } catch (e: any) {
      alert(e.message || 'Error executing Round 2 state transition');
    } finally {
      setActionLoading(false);
    }
  };

  const handleScore = async () => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/organizer/round1/score', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || 'Scoring failed');
      } else {
        await fetchRound1State();
        await fetchLeaderboard();
      }
    } catch (e: any) {
      alert(e.message || 'Error executing scoring');
    } finally {
      setActionLoading(false);
    }
  };

  const handleQualify = async () => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/organizer/round1/qualify', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || 'Qualification failed');
      } else {
        await fetchRound1State();
        await fetchLeaderboard();
      }
    } catch (e: any) {
      alert(e.message || 'Error executing qualification');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEmergencyLock = async () => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/organizer/round1/emergency-lock', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || 'Emergency lock failed');
      } else {
        setShowEmergencyModal(false);
        await fetchRound1State();
        await fetchLeaderboard();
      }
    } catch (e: any) {
      alert(e.message || 'Error locking round');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRound2EmergencyLock = async () => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/organizer/round2/emergency-lock', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || 'Emergency lock failed');
      } else {
        await fetchRound2State();
        await fetchRound2Leaderboard();
      }
    } catch (e: any) {
      alert(e.message || 'Error locking Round 2');
    } finally {
      setActionLoading(false);
    }
  };

  const stateColors: Record<string, string> = {
    DRAFT: 'bg-textMuted/20 text-textMuted border-textMuted/30',
    READY: 'bg-accentCyan/20 text-accentCyan border-accentCyan/40',
    LOBBY: 'bg-accentCyan/20 text-accentCyan border-accentCyan/40',
    COUNTDOWN: 'bg-accentYellow/20 text-accentYellow border-accentYellow/40',
    ACTIVE: 'bg-accentGreen/20 text-accentGreen border-accentGreen/40',
    MEMBER_1_ACTIVE: 'bg-accentGreen/20 text-accentGreen border-accentGreen/40',
    MEMBER_1_HANDOFF: 'bg-accentYellow/20 text-accentYellow border-accentYellow/40',
    MEMBER_2_ACTIVE: 'bg-accentGreen/20 text-accentGreen border-accentGreen/40',
    MEMBER_2_HANDOFF: 'bg-accentYellow/20 text-accentYellow border-accentYellow/40',
    MEMBER_3_ACTIVE: 'bg-accentGreen/20 text-accentGreen border-accentGreen/40',
    MEMBER_3_FINALIZE: 'bg-accentCyan/20 text-accentCyan border-accentCyan/40',
    SUBMISSION: 'bg-accentYellow/20 text-accentYellow border-accentYellow/40',
    LOCKED: 'bg-accentRed/20 text-accentRed border-accentRed/40',
    SCORING: 'bg-accentCyan/20 text-accentCyan border-accentCyan/40',
    QUALIFICATION: 'bg-accentGreen/20 text-accentGreen border-accentGreen/40',
    COMPLETE: 'bg-accentGreen/20 text-accentGreen border-accentGreen/40',
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-textPrimary">Competition Round Control Center</h1>
        <p className="text-sm text-textSecondary mt-1">
          Server-authoritative state machine, timing, scoring, and stage relay management
        </p>
      </div>

      {/* Round 2 Operational Console */}
      <div className="p-6 rounded-lg bg-bgSurfaceBase border border-accentCyan/30 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-borderSubtle pb-4">
          <div className="flex items-center space-x-3">
            <span className="w-9 h-9 rounded-full bg-accentCyan/20 text-accentCyan flex items-center justify-center font-bold font-mono text-sm border border-accentCyan/40">
              R2
            </span>
            <div>
              <h2 className="text-lg font-bold text-textPrimary">Round 2 — Triple Strike (Sequential Team Relay)</h2>
              <div className="text-xs font-mono text-textMuted">
                3 Members • M1 Debugging (15m) → M2 Coding (15m) → M3 Predict Output (15m)
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span
              className={`px-3 py-1 rounded font-mono text-xs font-bold border uppercase ${
                stateColors[round2State] || stateColors.DRAFT
              }`}
            >
              STATE: {round2State}
            </span>
            <button
              onClick={handleRound2EmergencyLock}
              className="px-3 py-1 bg-accentRed/10 hover:bg-accentRed/20 border border-accentRed/40 text-accentRed font-mono text-xs font-bold rounded transition-colors"
            >
              🚨 LOCK R2
            </button>
          </div>
        </div>

        {/* Universal Event Control Toolbar (Step 1: Load, Step 2: Start Timer, Pause, Resume, End, Reset) */}
        <div className="space-y-3">
          <div className="text-xs font-mono text-textMuted uppercase tracking-wider">
            ORGANIZER EVENT-DAY CONTROLS (SERVER AUTHORITATIVE)
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={async () => {
                try {
                  setActionLoading(true);
                  const res = await fetch('/api/organizer/rounds/2/load', { method: 'POST' });
                  if (res.ok) {
                    alert('Round 2 STAGED successfully! Qualified participants notified.');
                    fetchRound2State();
                  } else {
                    const err = await res.json();
                    alert(err.message || 'Load failed');
                  }
                } catch (e: any) {
                  alert(e.message || 'Load error');
                } finally {
                  setActionLoading(false);
                }
              }}
              disabled={actionLoading}
              className="px-4 py-2 bg-accentCyan/20 hover:bg-accentCyan/30 text-accentCyan border border-accentCyan/40 rounded font-mono text-xs font-bold"
            >
              1. LOAD ROUND 2 (STAGE) 📥
            </button>

            <button
              onClick={async () => {
                try {
                  setActionLoading(true);
                  const res = await fetch('/api/organizer/rounds/2/start', { method: 'POST' });
                  if (res.ok) {
                    alert('Round 2 TIMER STARTED! 5s synchronized countdown broadcasted.');
                    fetchRound2State();
                  } else {
                    const err = await res.json();
                    alert(err.message || 'Start failed');
                  }
                } catch (e: any) {
                  alert(e.message || 'Start error');
                } finally {
                  setActionLoading(false);
                }
              }}
              disabled={actionLoading}
              className="px-4 py-2 bg-accentGreen text-bgApp hover:bg-accentGreen/90 rounded font-mono text-xs font-bold shadow-md"
            >
              2. START TIMER (5S COUNTDOWN) 🚀
            </button>

            <button
              onClick={async () => {
                try {
                  setActionLoading(true);
                  const res = await fetch('/api/organizer/rounds/2/pause', { method: 'POST' });
                  if (res.ok) {
                    alert('Round 2 PAUSED on server.');
                    fetchRound2State();
                  } else {
                    const err = await res.json();
                    alert(err.message || 'Pause failed');
                  }
                } catch (e: any) {
                  alert(e.message || 'Pause error');
                } finally {
                  setActionLoading(false);
                }
              }}
              disabled={actionLoading}
              className="px-4 py-2 bg-accentYellow/20 hover:bg-accentYellow/30 text-accentYellow border border-accentYellow/40 rounded font-mono text-xs font-bold"
            >
              ⏸️ PAUSE
            </button>

            <button
              onClick={async () => {
                try {
                  setActionLoading(true);
                  const res = await fetch('/api/organizer/rounds/2/resume', { method: 'POST' });
                  if (res.ok) {
                    alert('Round 2 RESUMED! Authoritative deadline adjusted.');
                    fetchRound2State();
                  } else {
                    const err = await res.json();
                    alert(err.message || 'Resume failed');
                  }
                } catch (e: any) {
                  alert(e.message || 'Resume error');
                } finally {
                  setActionLoading(false);
                }
              }}
              disabled={actionLoading}
              className="px-4 py-2 bg-accentGreen/20 hover:bg-accentGreen/30 text-accentGreen border border-accentGreen/40 rounded font-mono text-xs font-bold"
            >
              ▶️ RESUME
            </button>

            <button
              onClick={async () => {
                try {
                  setActionLoading(true);
                  const res = await fetch('/api/organizer/rounds/2/end', { method: 'POST' });
                  if (res.ok) {
                    alert('Round 2 FINALIZED.');
                    fetchRound2State();
                  } else {
                    const err = await res.json();
                    alert(err.message || 'End failed');
                  }
                } catch (e: any) {
                  alert(e.message || 'End error');
                } finally {
                  setActionLoading(false);
                }
              }}
              disabled={actionLoading}
              className="px-4 py-2 bg-accentRed/20 hover:bg-accentRed/30 text-accentRed border border-accentRed/40 rounded font-mono text-xs font-bold"
            >
              🛑 END ROUND
            </button>

            <button
              onClick={async () => {
                const code = prompt('⚠️ WARNING: Resetting Round 2 will invalidate active sessions! Type "RESET_ROUND_CONFIRM" to confirm:');
                if (code === 'RESET_ROUND_CONFIRM') {
                  try {
                    setActionLoading(true);
                    const res = await fetch('/api/organizer/rounds/2/reset', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ confirmationCode: code }),
                    });
                    if (res.ok) {
                      alert('Round 2 RESET to DRAFT state.');
                      fetchRound2State();
                    } else {
                      const err = await res.json();
                      alert(err.message || 'Reset failed');
                    }
                  } catch (e: any) {
                    alert(e.message || 'Reset error');
                  } finally {
                    setActionLoading(false);
                  }
                }
              }}
              disabled={actionLoading}
              className="px-4 py-2 bg-accentRed text-white hover:bg-accentRed/90 rounded font-mono text-xs font-bold border-2 border-red-500 shadow-lg"
            >
              ⚠️ RESET ROUND
            </button>
          </div>
        </div>

        {/* Live Team Stage Progression Table */}
        <div className="space-y-3 pt-4 border-t border-borderSubtle">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider font-mono">
              Live Team Relay Progress & Security Tracking ({round2Leaderboard.length} Qualified Teams)
            </h3>
            <button onClick={fetchRound2Leaderboard} className="text-xs font-mono text-accentCyan hover:underline">
              🔄 Refresh R2 Progress
            </button>
          </div>

          <div className="overflow-x-auto border border-borderSubtle rounded-lg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-bgSurfaceHover text-textMuted uppercase border-b border-borderSubtle">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Team Code</th>
                  <th className="p-3">Team Name</th>
                  <th className="p-3">Current Stage</th>
                  <th className="p-3">Active Member</th>
                  <th className="p-3">Stage Status</th>
                  <th className="p-3">Warnings</th>
                  <th className="p-3">Score (Predict Output)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderSubtle">
                {round2Leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-textMuted">
                      No qualified Round 2 teams loaded.
                    </td>
                  </tr>
                ) : (
                  round2Leaderboard.map((entry) => (
                    <tr key={entry.teamId} className="hover:bg-bgSurfaceHover/50">
                      <td className="p-3 font-bold text-accentCyan">#{entry.rank}</td>
                      <td className="p-3 text-textPrimary">{entry.teamCode}</td>
                      <td className="p-3 text-textSecondary">{entry.teamName}</td>
                      <td className="p-3 font-bold text-accentGreen">Stage {entry.currentStageOrder}</td>
                      <td className="p-3 text-textMuted">Member {entry.activeMemberOrder}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-accentCyan/20 text-accentCyan border border-accentCyan/30 font-bold">
                          {entry.stageStatus}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`font-bold ${entry.warningCount >= 2 ? 'text-accentRed' : 'text-accentYellow'}`}>
                          {entry.warningCount} / 3
                        </span>
                      </td>
                      <td className="p-3 font-bold text-accentGreen">{entry.score} pts</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Round 1 Active Operational Console */}
      <div className="p-6 rounded-lg bg-bgSurfaceBase border border-borderSubtle space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-borderSubtle pb-4">
          <div className="flex items-center space-x-3">
            <span className="w-9 h-9 rounded-full bg-accentCyan/10 text-accentCyan flex items-center justify-center font-bold font-mono text-sm border border-accentCyan/20">
              R1
            </span>
            <div>
              <h2 className="text-lg font-bold text-textPrimary">Round 1 — Code IQ (20 MCQ / 20 Mins)</h2>
              <div className="text-xs font-mono text-textMuted">
                Single Team Representative Mode • Dynamic Team Count (Target Capacity: 200)
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span
              className={`px-3 py-1 rounded font-mono text-xs font-bold border uppercase ${
                stateColors[round1State] || stateColors.DRAFT
              }`}
            >
              STATE: {round1State}
            </span>
            <button
              onClick={() => setShowEmergencyModal(true)}
              className="px-3 py-1 bg-accentRed/10 hover:bg-accentRed/20 border border-accentRed/40 text-accentRed font-mono text-xs font-bold rounded transition-colors"
            >
              🚨 EMERGENCY LOCK
            </button>
          </div>
        </div>

        {/* State Machine Transition Actions */}
        <div className="space-y-3">
          <div className="text-xs font-mono text-textMuted uppercase tracking-wider">
            AUTHORITATIVE STATE MACHINE TRANSITIONS
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {round1State === 'DRAFT' && (
              <button
                onClick={() => handleTransition('READY')}
                disabled={actionLoading}
                className="px-4 py-2 bg-accentCyan/20 hover:bg-accentCyan/30 text-accentCyan border border-accentCyan/40 rounded font-mono text-xs font-bold"
              >
                1. SET READY →
              </button>
            )}

            {round1State === 'READY' && (
              <button
                onClick={() => handleTransition('LOBBY')}
                disabled={actionLoading}
                className="px-4 py-2 bg-accentCyan/20 hover:bg-accentCyan/30 text-accentCyan border border-accentCyan/40 rounded font-mono text-xs font-bold"
              >
                2. OPEN LOBBY →
              </button>
            )}

            {round1State === 'LOBBY' && (
              <button
                onClick={() => handleTransition('COUNTDOWN')}
                disabled={actionLoading}
                className="px-4 py-2 bg-accentYellow/20 hover:bg-accentYellow/30 text-accentYellow border border-accentYellow/40 rounded font-mono text-xs font-bold"
              >
                3. START COUNTDOWN →
              </button>
            )}

            {round1State === 'COUNTDOWN' && (
              <button
                onClick={() => handleTransition('ACTIVE')}
                disabled={actionLoading}
                className="px-4 py-2 bg-accentGreen text-bgApp hover:bg-accentGreen/90 rounded font-mono text-xs font-bold shadow-md"
              >
                4. START ROUND (20 MINS) 🚀
              </button>
            )}

            {round1State === 'ACTIVE' && (
              <button
                onClick={() => handleTransition('LOCKED')}
                disabled={actionLoading}
                className="px-4 py-2 bg-accentRed/20 hover:bg-accentRed/30 text-accentRed border border-accentRed/40 rounded font-mono text-xs font-bold"
              >
                5. LOCK SUBMISSIONS 🔒
              </button>
            )}

            {round1State === 'LOCKED' && (
              <button
                onClick={handleScore}
                disabled={actionLoading}
                className="px-4 py-2 bg-accentCyan text-bgApp hover:bg-accentCyan/90 rounded font-mono text-xs font-bold shadow-md"
              >
                6. EXECUTE SCORING ENGINE 🧮
              </button>
            )}

            {(round1State === 'SCORING' || round1State === 'QUALIFICATION') && (
              <button
                onClick={handleQualify}
                disabled={actionLoading}
                className="px-4 py-2 bg-accentGreen text-bgApp hover:bg-accentGreen/90 rounded font-mono text-xs font-bold shadow-md"
              >
                7. EVALUATE QUALIFICATION (50%) 🏆
              </button>
            )}

            {round1State === 'QUALIFICATION' && (
              <button
                onClick={() => handleTransition('COMPLETE')}
                disabled={actionLoading}
                className="px-4 py-2 bg-accentGreen/20 hover:bg-accentGreen/30 text-accentGreen border border-accentGreen/40 rounded font-mono text-xs font-bold"
              >
                8. MARK ROUND COMPLETE ✅
              </button>
            )}
          </div>
        </div>

        {/* Leaderboard & Tie-Break Preview Table */}
        <div className="space-y-3 pt-4 border-t border-borderSubtle">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider font-mono">
              Round 1 Live Leaderboard ({leaderboard.length} Teams)
            </h3>
            <button onClick={fetchLeaderboard} className="text-xs font-mono text-accentCyan hover:underline">
              🔄 Refresh Leaderboard
            </button>
          </div>

          <div className="overflow-x-auto border border-borderSubtle rounded-lg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-bgSurfaceHover text-textMuted uppercase border-b border-borderSubtle">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Team Code</th>
                  <th className="p-3">Team Name</th>
                  <th className="p-3">Representative</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Submitted At</th>
                  <th className="p-3">Qualification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderSubtle">
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-textMuted">
                      No active submissions recorded yet.
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((entry) => (
                    <tr key={entry.teamId} className="hover:bg-bgSurfaceHover/50">
                      <td className="p-3 font-bold text-accentCyan">#{entry.rank}</td>
                      <td className="p-3 text-textPrimary">{entry.teamCode}</td>
                      <td className="p-3 text-textSecondary">{entry.teamName}</td>
                      <td className="p-3 text-textMuted">{entry.representativeName}</td>
                      <td className="p-3 font-bold text-accentGreen">{entry.score} pts</td>
                      <td className="p-3 text-textMuted">
                        {entry.submittedAt ? new Date(entry.submittedAt).toLocaleTimeString() : 'In Progress'}
                      </td>
                      <td className="p-3">
                        {entry.isQualified ? (
                          <span className="px-2 py-0.5 rounded bg-accentGreen/20 text-accentGreen border border-accentGreen/30 font-bold">
                            QUALIFIED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-textMuted/20 text-textMuted border border-borderSubtle">
                            PENDING / ELIMINATED
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Emergency Lock Confirmation Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full p-6 rounded-lg bg-bgSurfaceBase border border-accentRed/40 space-y-4">
            <h3 className="text-lg font-bold text-accentRed flex items-center space-x-2">
              <span>🚨</span>
              <span>Confirm Emergency Lock</span>
            </h3>
            <p className="text-xs text-textSecondary">
              Are you sure you want to execute an emergency round lock? This will immediately transition Round 1 to LOCKED, reject any further submissions, and log an audit event.
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="px-4 py-2 rounded bg-bgSurfaceHover text-xs font-mono text-textPrimary"
              >
                CANCEL
              </button>
              <button
                onClick={handleEmergencyLock}
                disabled={actionLoading}
                className="px-4 py-2 rounded bg-accentRed text-white font-mono text-xs font-bold"
              >
                EXECUTE EMERGENCY LOCK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
