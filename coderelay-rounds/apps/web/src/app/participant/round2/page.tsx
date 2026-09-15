'use client';

import React, { useState, useEffect, useRef } from 'react';


interface Option {
  id: string;
  label: string;
  content: string;
  displayOrder: number;
}

interface Question {
  id: string;
  title: string;
  problemStatement: string;
  codeSnippet: string | null;
  language: string | null;
  type: string;
  marks: number;
  stageOrder: number;
  displayOrder: number;
  options: Option[];
}

export default function ParticipantRound2Page() {
  const [loading, setLoading] = useState<boolean>(true);
  const [participantState, setParticipantState] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [codeContents, setCodeContents] = useState<Record<string, string>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number>(900);
  const [warningCount, setWarningCount] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [stageCompleted, setStageCompleted] = useState<boolean>(false);

  useEffect(() => {
    fetchStateAndQuestions();
    const stateInterval = setInterval(fetchStateAndQuestions, 4000);
    const timerInterval = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      clearInterval(stateInterval);
      clearInterval(timerInterval);
    };
  }, []);

  // Security Event Listeners
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportSecurityViolation('VISIBILITY_CHANGE', 'Tab switched or window minimized');
      }
    };

    const handleBlur = () => {
      reportSecurityViolation('TAB_SWITCH', 'Browser window lost focus');
    };

    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull) {
        reportSecurityViolation('FULLSCREEN_EXIT', 'Exited fullscreen mode');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [participantState]);

  const fetchStateAndQuestions = async () => {
    try {
      const res = await fetch('/api/round2/state');
      if (!res.ok) return;
      const data = await res.json();
      setParticipantState(data);
      setRemainingSeconds(data.remainingSeconds || 0);
      setWarningCount(data.warningCount || 0);
      if (data.isSubmitted || data.isAutoSubmitted) {
        setStageCompleted(true);
      }

      if (data.isCurrentMemberActive && !data.isSubmitted) {
        const qRes = await fetch('/api/round2/questions');
        if (qRes.ok) {
          const qData = await qRes.json();
          setQuestions(qData);
        }

        const aRes = await fetch('/api/round2/answers');
        if (aRes.ok) {
          const aData = await aRes.json();
          setAnswers(aData.answers || {});
          setCodeContents(aData.codeContents || {});
        }
      }
    } catch (e) {
      console.error('Error syncing Round 2 state:', e);
    } finally {
      setLoading(false);
    }
  };

  const reportSecurityViolation = async (violationType: string, details: string) => {
    try {
      const res = await fetch('/api/round2/security-violation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ violationType, details }),
      });
      if (res.ok) {
        const data = await res.json();
        setWarningCount(data.warningCount);
        if (data.autoSubmitted) {
          setStageCompleted(true);
          await fetchStateAndQuestions();
        }
      }
    } catch (e) {
      console.error('Failed to report security violation:', e);
    }
  };

  const handleSelectOption = async (questionId: string, optionId: string, label: string) => {
    if (stageCompleted) return;
    const newAnswers = { ...answers, [questionId]: optionId };
    setAnswers(newAnswers);

    try {
      await fetch('/api/round2/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, selectedOptionId: optionId, selectedLabel: label }),
      });
    } catch (e) {
      console.error('Error saving answer:', e);
    }
  };

  const handleCodeChange = async (questionId: string, val: string | undefined) => {
    if (stageCompleted || !val) return;
    const newCode = { ...codeContents, [questionId]: val };
    setCodeContents(newCode);

    try {
      await fetch('/api/round2/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, codeContent: val }),
      });
    } catch (e) {
      console.error('Error saving code content:', e);
    }
  };

  const handleSubmitStage = async () => {
    try {
      setSubmitting(true);
      const res = await fetch('/api/round2/submit-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: true }),
      });

      if (res.ok) {
        setShowConfirmModal(false);
        setStageCompleted(true);
        await fetchStateAndQuestions();
      } else {
        const err = await res.json();
        alert(err.message || 'Submission failed');
      }
    } catch (e: any) {
      alert(e.message || 'Error executing stage submission');
    } finally {
      setSubmitting(false);
    }
  };

  const requestFullscreenMode = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bgApp text-textPrimary flex items-center justify-center font-mono text-sm">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 rounded-full border-2 border-accentCyan border-t-transparent animate-spin" />
          <span>Synchronizing Round 2 Arena State...</span>
        </div>
      </div>
    );
  }

  const currentQ = questions[activeQuestionIndex];

  return (
    <div className="min-h-screen bg-bgApp text-textPrimary flex flex-col justify-between p-6 font-sans select-none">
      {/* Top Bar / Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-borderSubtle pb-4">
        <div className="flex items-center space-x-4">
          <span className="px-3 py-1 rounded bg-accentCyan/10 border border-accentCyan/30 font-mono text-xs font-bold text-accentCyan">
            ROUND 2 — TRIPLE STRIKE
          </span>
          <div>
            <h1 className="text-lg font-bold text-textPrimary">
              {participantState?.teamName} ({participantState?.teamCode})
            </h1>
            <div className="text-xs text-textMuted font-mono">
              Member: <span className="text-textPrimary font-bold">{participantState?.memberName}</span> (Member {participantState?.memberOrder})
            </div>
          </div>
        </div>

        {/* Dynamic Member & Role HUD */}
        <div className="flex items-center space-x-3">
          <div className="px-3 py-1 rounded bg-bgSurfaceBase border border-borderSubtle flex items-center space-x-2 font-mono text-xs">
            <span className="text-textMuted uppercase">ROLE:</span>
            <span className="font-bold text-accentCyan uppercase">{participantState?.activeRole}</span>
          </div>

          <div className="px-3 py-1 rounded bg-bgSurfaceBase border border-borderSubtle flex items-center space-x-2 font-mono text-xs">
            <span className="text-textMuted uppercase">WARNINGS:</span>
            <span className={`font-bold ${warningCount >= 2 ? 'text-accentRed' : 'text-accentYellow'}`}>
              {warningCount} / 3
            </span>
          </div>

          <div className="px-4 py-1.5 rounded-lg bg-bgSurfaceBase border-2 border-accentCyan font-mono text-sm font-bold text-accentCyan">
            ⏱️ {formatTimer(remainingSeconds)}
          </div>
        </div>
      </header>

      {/* Main Arena Workspace */}
      <main className="my-auto py-6">
        {!isFullscreen && (
          <div className="mb-4 p-3 rounded-lg bg-accentRed/10 border border-accentRed/30 flex items-center justify-between text-xs font-mono text-accentRed">
            <span>⚠️ FULLSCREEN MODE REQUIRED FOR COMPETITION SECURITY</span>
            <button
              onClick={requestFullscreenMode}
              className="px-3 py-1 bg-accentRed text-white font-bold rounded hover:bg-accentRed/90"
            >
              ENTER FULLSCREEN
            </button>
          </div>
        )}

        {!participantState?.isCurrentMemberActive || stageCompleted ? (
          /* Waiting / Handoff / Locked State Screen */
          <div className="max-w-2xl mx-auto p-8 rounded-xl bg-bgSurfaceBase border border-borderSubtle text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-accentCyan/10 text-accentCyan flex items-center justify-center font-mono font-bold text-2xl mx-auto border border-accentCyan/30">
              🔒
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-textPrimary">
                {stageCompleted ? 'STAGE SUBMISSION COMPLETE' : 'WAITING FOR YOUR ACTIVE STAGE'}
              </h2>
              <p className="text-sm text-textSecondary max-w-md mx-auto">
                {stageCompleted
                  ? `Stage ${participantState?.activeStageOrder} (${participantState?.activeRole}) has been locked. Handoff to the next team member is managed by the server.`
                  : `Currently Active: Member ${participantState?.activeStageOrder} (${participantState?.activeRole}). You are Member ${participantState?.memberOrder}. You will be activated during your designated stage.`}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-bgApp border border-borderSubtle text-xs font-mono text-textMuted space-y-1 text-left">
              <div>• Current Round State: <span className="text-accentCyan font-bold">{participantState?.roundState}</span></div>
              <div>• Active Stage Order: <span className="text-textPrimary font-bold">Stage {participantState?.activeStageOrder}</span></div>
              <div>• Active Role: <span className="text-accentGreen font-bold">{participantState?.activeRole}</span></div>
            </div>
          </div>
        ) : (
          /* Active Question Workspace */
          <div className="space-y-6">
            {/* Question Navigation Strip */}
            <div className="flex items-center justify-between bg-bgSurfaceBase p-3 rounded-lg border border-borderSubtle">
              <div className="flex items-center space-x-2">
                {questions.map((q, idx) => {
                  const isAnswered = !!answers[q.id] || !!codeContents[q.id];
                  const isActive = idx === activeQuestionIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setActiveQuestionIndex(idx)}
                      className={`w-9 h-9 rounded font-mono text-xs font-bold border transition-colors ${
                        isActive
                          ? 'bg-accentCyan text-bgApp border-accentCyan'
                          : isAnswered
                          ? 'bg-accentGreen/20 text-accentGreen border-accentGreen/40'
                          : 'bg-bgApp text-textMuted border-borderSubtle hover:border-textMuted'
                      }`}
                    >
                      Q{idx + 1}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setShowConfirmModal(true)}
                className="px-4 py-2 bg-accentGreen text-bgApp hover:bg-accentGreen/90 font-mono text-xs font-bold rounded shadow-md"
              >
                SUBMIT STAGE →
              </button>
            </div>

            {/* Question Details Workspace */}
            {currentQ && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Problem Statement Box */}
                <div className="p-6 rounded-xl bg-bgSurfaceBase border border-borderSubtle space-y-4 font-mono">
                  <div className="flex items-center justify-between border-b border-borderSubtle pb-3">
                    <h3 className="text-sm font-bold text-accentCyan">
                      Question {activeQuestionIndex + 1} of {questions.length} — {currentQ.title}
                    </h3>
                    <span className="text-xs text-textMuted">{currentQ.marks} Marks</span>
                  </div>

                  <div className="text-sm text-textPrimary leading-relaxed whitespace-pre-wrap">
                    {currentQ.problemStatement}
                  </div>

                  {currentQ.codeSnippet && (
                    <div className="mt-4 p-4 rounded bg-bgApp border border-borderSubtle text-xs text-accentGreen font-mono overflow-x-auto">
                      <pre>{currentQ.codeSnippet}</pre>
                    </div>
                  )}
                </div>

                {/* Response Input Box (Monaco / MCQ) */}
                <div className="p-6 rounded-xl bg-bgSurfaceBase border border-borderSubtle space-y-4">
                  {participantState?.activeRole === 'PREDICT_OUTPUT' && currentQ.options.length > 0 ? (
                    /* Predict Output MCQ Cards */
                    <div className="space-y-3">
                      <h4 className="text-xs font-mono text-textMuted uppercase">Select Output Option</h4>
                      {currentQ.options.map((opt) => {
                        const isSelected = answers[currentQ.id] === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => handleSelectOption(currentQ.id, opt.id, opt.label)}
                            className={`w-full p-4 rounded-lg border text-left font-mono text-xs flex items-center justify-between transition-colors ${
                              isSelected
                                ? 'bg-accentCyan/10 border-accentCyan text-accentCyan font-bold'
                                : 'bg-bgApp border-borderSubtle hover:bg-bgSurfaceHover text-textPrimary'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <span className="w-6 h-6 rounded bg-bgSurfaceActive flex items-center justify-center font-bold">
                                {opt.label}
                              </span>
                              <span>{opt.content}</span>
                            </div>
                            {isSelected && <span>✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* Coding / Debugging Monaco Code Editor */
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-mono text-textMuted">
                        <span>CODE EDITOR ({currentQ.language || 'python'})</span>
                        <span className="text-accentGreen">Draft Saved Automatically</span>
                      </div>
                      <div className="h-[360px] border border-borderSubtle rounded-lg overflow-hidden">
                        <textarea
                          className="w-full h-full p-4 bg-bgApp text-accentCyan font-mono text-xs focus:outline-none resize-none"
                          value={codeContents[currentQ.id] !== undefined ? codeContents[currentQ.id] : (currentQ.codeSnippet || '# Write your solution here\n')}
                          onChange={(e) => handleCodeChange(currentQ.id, e.target.value)}
                          placeholder="# Write your solution here"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Stage Submission Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full p-6 rounded-lg bg-bgSurfaceBase border border-accentCyan/40 space-y-4 font-mono">
            <h3 className="text-lg font-bold text-accentCyan">Confirm Stage Submission</h3>
            <p className="text-xs text-textSecondary">
              Are you sure you want to finalize Stage {participantState?.activeStageOrder} ({participantState?.activeRole})? Your answers will be locked and handed off to the next member.
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded bg-bgSurfaceHover text-xs text-textPrimary"
              >
                CANCEL
              </button>
              <button
                onClick={handleSubmitStage}
                disabled={submitting}
                className="px-4 py-2 rounded bg-accentGreen text-bgApp font-bold text-xs"
              >
                CONFIRM & SUBMIT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-borderSubtle pt-4 flex justify-between items-center text-xs font-mono text-textMuted">
        <span>VIDYANTRA 2026 • TRIPLE STRIKE ARENA</span>
        <span>SERVER AUTHORITATIVE COMPETITION ENGINE</span>
      </footer>
    </div>
  );
}
