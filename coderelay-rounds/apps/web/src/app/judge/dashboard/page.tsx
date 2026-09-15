'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface RoundItem {
  id: string;
  roundNumber: number;
  slug: string;
  title: string;
  description: string;
  status: string;
  scoringType: string;
}

interface TeamMember {
  id: string;
  displayName: string;
  memberOrder: number;
}

interface TeamEvaluation {
  score: number;
  feedback: string | null;
  evaluatedAt: string;
}

interface TeamItem {
  id: string;
  teamCode: string;
  name: string;
  isQualifiedR2: boolean;
  isQualifiedR4: boolean;
  members: TeamMember[];
  evaluation: TeamEvaluation | null;
}

export default function JudgeDashboardPage() {
  const [rounds, setRounds] = useState<RoundItem[]>([]);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [scoreInput, setScoreInput] = useState<string>('');
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [isLoadingRounds, setIsLoadingRounds] = useState(true);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // 1. Fetch available judge rounds
  useEffect(() => {
    const fetchRounds = async () => {
      setIsLoadingRounds(true);
      try {
        const token = getToken();
        const res = await fetch('/api/judge/rounds', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data: RoundItem[] = await res.json();
          setRounds(data);
          if (data.length > 0) {
            // Select round 3 or 4 if available, otherwise first round
            const defaultRound = data.find(r => r.roundNumber >= 3) || data[0];
            setSelectedRound(defaultRound.roundNumber);
          }
        }
      } catch (err) {
        console.error('Failed to load judge rounds:', err);
      } finally {
        setIsLoadingRounds(false);
      }
    };
    fetchRounds();
  }, []);

  // 2. Fetch teams for selected round
  useEffect(() => {
    if (!selectedRound) return;

    const fetchTeams = async () => {
      setIsLoadingTeams(true);
      try {
        const token = getToken();
        const res = await fetch(`/api/judge/rounds/${selectedRound}/teams`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data: TeamItem[] = await res.json();
          setTeams(data);
          if (data.length > 0 && !selectedTeamId) {
            setSelectedTeamId(data[0].id);
            if (data[0].evaluation) {
              setScoreInput(data[0].evaluation.score.toString());
              setFeedbackInput(data[0].evaluation.feedback || '');
            } else {
              setScoreInput('');
              setFeedbackInput('');
            }
          }
        }
      } catch (err) {
        console.error('Failed to load teams:', err);
      } finally {
        setIsLoadingTeams(false);
      }
    };
    fetchTeams();
  }, [selectedRound]);

  // When team selection changes, update inputs
  const handleSelectTeam = (team: TeamItem) => {
    setSelectedTeamId(team.id);
    setStatusMessage(null);
    if (team.evaluation) {
      setScoreInput(team.evaluation.score.toString());
      setFeedbackInput(team.evaluation.feedback || '');
    } else {
      setScoreInput('');
      setFeedbackInput('');
    }
  };

  // Submit evaluation
  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRound || !selectedTeamId) return;

    const scoreNum = parseFloat(scoreInput);
    if (isNaN(scoreNum) || scoreNum < 0) {
      setStatusMessage({ type: 'error', text: 'Score must be a non-negative number (>= 0).' });
      return;
    }

    setIsSubmittingScore(true);
    setStatusMessage(null);

    try {
      const token = getToken();
      const res = await fetch(`/api/judge/rounds/${selectedRound}/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          teamId: selectedTeamId,
          score: scoreNum,
          feedback: feedbackInput.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to save evaluation.');
      }

      setStatusMessage({ type: 'success', text: `Score of ${scoreNum} saved successfully for team!` });

      // Refresh team list to update local state
      const tokenRef = getToken();
      const refreshRes = await fetch(`/api/judge/rounds/${selectedRound}/teams`, {
        headers: tokenRef ? { Authorization: `Bearer ${tokenRef}` } : {},
      });
      if (refreshRes.ok) {
        const updatedTeams: TeamItem[] = await refreshRes.json();
        setTeams(updatedTeams);
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error saving score.' });
    } finally {
      setIsSubmittingScore(false);
    }
  };

  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  return (
    <div className="min-h-screen bg-bgApp bg-tech-grid text-textPrimary p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-borderMedium/80 pb-4">
          <div>
            <div className="text-[10px] font-mono text-accentCyan uppercase tracking-widest bg-accentCyan/10 px-3 py-1 rounded inline-block">
              VIDYANTRA 2026 // EVALUATION CONSOLE
            </div>
            <h1 className="text-3xl font-extrabold font-mono text-textPrimary uppercase tracking-tight mt-2">
              JUDGE EVALUATION PORTAL
            </h1>
          </div>
          <Link href="/" className="text-xs font-mono text-textMuted hover:text-accentCyan transition-colors">
            ← RETURN TO MAIN PORTAL
          </Link>
        </div>

        {/* Round Selector Tabs */}
        <div className="flex items-center space-x-2 border-b border-borderSubtle pb-2 overflow-x-auto">
          <span className="text-xs font-mono text-textMuted uppercase tracking-wider mr-2">SELECT ROUND:</span>
          {isLoadingRounds ? (
            <span className="text-xs font-mono text-textMuted">LOADING ROUNDS...</span>
          ) : rounds.length === 0 ? (
            <span className="text-xs font-mono text-textMuted">NO ROUNDS CONFIGURED</span>
          ) : (
            rounds.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRound(r.roundNumber)}
                className={`px-4 py-2 rounded font-mono text-xs uppercase font-bold transition-all border ${
                  selectedRound === r.roundNumber
                    ? 'bg-accentCyan/20 text-accentCyan border-accentCyan shadow-[0_0_15px_rgba(0,210,255,0.2)]'
                    : 'bg-bgSurfaceBase text-textMuted border-borderMedium hover:text-textPrimary'
                }`}
              >
                ROUND {r.roundNumber} ({r.scoringType})
              </button>
            ))
          )}
        </div>

        {/* Main Content: Teams List (Left) + Evaluation Form (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Participating Teams List */}
          <div className="md:col-span-1 p-5 rounded-xl bg-bgSurfaceBase/90 border border-borderMedium glass-panel space-y-4">
            <div className="flex items-center justify-between border-b border-borderSubtle pb-3">
              <h2 className="text-sm font-bold font-mono text-textPrimary uppercase tracking-wider">
                PARTICIPATING TEAMS ({teams.length})
              </h2>
              {isLoadingTeams && <span className="text-[10px] font-mono text-accentCyan animate-pulse">SYNCING...</span>}
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {teams.length === 0 ? (
                <p className="text-xs font-mono text-textMuted text-center py-6">No teams registered for this round.</p>
              ) : (
                teams.map((t) => {
                  const isSelected = t.id === selectedTeamId;
                  const isEvaluated = t.evaluation !== null;
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTeam(t)}
                      className={`w-full text-left p-3.5 rounded-lg border transition-all space-y-1.5 ${
                        isSelected
                          ? 'bg-bgSurfaceElevated border-accentCyan text-textPrimary shadow-[0_0_15px_rgba(0,210,255,0.15)]'
                          : 'bg-bgApp/60 border-borderSubtle text-textSecondary hover:border-borderMedium'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-accentCyan">{t.teamCode}</span>
                        {isEvaluated ? (
                          <span className="text-[10px] font-mono text-statusSuccess bg-statusSuccess/10 px-2 py-0.5 rounded border border-statusSuccess/30 font-bold">
                            SCORE: {t.evaluation?.score}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-textMuted bg-bgSurfaceBase px-2 py-0.5 rounded border border-borderSubtle">
                            PENDING
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-textPrimary truncate">{t.name}</div>
                      <div className="text-[10px] font-mono text-textMuted truncate">
                        MEMBERS: {t.members.map(m => m.displayName).join(', ') || 'N/A'}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Evaluation Workspace */}
          <div className="md:col-span-2 p-6 rounded-xl bg-bgSurfaceBase/90 border border-borderMedium glass-panel space-y-6">
            {selectedTeam ? (
              <div className="space-y-6">
                {/* Team Info Header */}
                <div className="border-b border-borderSubtle pb-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-mono text-accentCyan font-bold">{selectedTeam.teamCode}</div>
                    <h2 className="text-xl font-bold font-mono text-textPrimary uppercase">{selectedTeam.name}</h2>
                    <p className="text-xs font-mono text-textMuted mt-1">
                      Team Roster: {selectedTeam.members.map(m => `Member ${m.memberOrder}: ${m.displayName}`).join(' | ')}
                    </p>
                  </div>
                  {selectedTeam.evaluation && (
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-textMuted">CURRENT SCORE</div>
                      <div className="text-2xl font-bold font-mono text-accentCyan">{selectedTeam.evaluation.score}</div>
                    </div>
                  )}
                </div>

                {/* Status Message Alert */}
                {statusMessage && (
                  <div
                    className={`p-3.5 rounded-lg border text-xs font-mono flex items-start space-x-2 ${
                      statusMessage.type === 'success'
                        ? 'bg-statusSuccess/10 border-statusSuccess/40 text-statusSuccess'
                        : 'bg-statusDanger/10 border-statusDanger/40 text-statusDanger'
                    }`}
                  >
                    <span>{statusMessage.type === 'success' ? '✅' : '⚠️'}</span>
                    <span>{statusMessage.text}</span>
                  </div>
                )}

                {/* Evaluation Form */}
                <form onSubmit={handleSaveEvaluation} className="space-y-5">
                  {/* Score Input */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono text-textSecondary uppercase tracking-wider">
                      ASSIGNED JUDGE SCORE <span className="text-accentCyan">* (MIN 0)</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="e.g. 85.5"
                      value={scoreInput}
                      onChange={(e) => setScoreInput(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-bgApp border border-borderMedium focus:border-accentCyan focus:outline-none text-textPrimary font-mono text-lg font-bold placeholder:text-textMuted/40 transition-colors"
                      disabled={isSubmittingScore}
                    />
                  </div>

                  {/* Feedback Notes Input */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono text-textSecondary uppercase tracking-wider">
                      JUDGE FEEDBACK / EVALUATION REMARKS (OPTIONAL)
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Add evaluation comments, code quality assessment, architecture notes..."
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-bgApp border border-borderMedium focus:border-accentCyan focus:outline-none text-textPrimary font-mono text-sm placeholder:text-textMuted/40 transition-colors"
                      disabled={isSubmittingScore}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmittingScore}
                    className="w-full py-3.5 px-4 rounded-lg bg-accentCyan text-bgApp font-mono font-bold text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(0,210,255,0.25)] hover:shadow-[0_0_30px_rgba(0,210,255,0.4)] disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
                  >
                    {isSubmittingScore ? (
                      <span>SAVING EVALUATION...</span>
                    ) : (
                      <span>[ SAVE EVALUATION ]</span>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-12 text-center border border-dashed border-borderMedium rounded-lg space-y-3">
                <div className="text-3xl">⚖️</div>
                <h3 className="text-base font-bold font-mono text-textPrimary uppercase">
                  Select a Team to Evaluate
                </h3>
                <p className="text-xs font-mono text-textMuted max-w-md mx-auto leading-relaxed">
                  Choose a team from the participating teams roster on the left to inspect details and enter judge scores.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
