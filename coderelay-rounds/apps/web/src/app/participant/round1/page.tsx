'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  codeSnippet?: string | null;
  language?: string | null;
  type: string;
  marks: number;
  displayOrder: number;
  options: Option[];
}

export default function Round1ParticipantPage() {
  const router = useRouter();

  // State management
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [roundState, setRoundState] = useState<string>('DRAFT');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(1200);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Fetch initial state & questions
  useEffect(() => {
    fetchRoundData();
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchRoundData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch State
      const stateRes = await fetch('/api/round1/state');
      if (!stateRes.ok) {
        if (stateRes.status === 401 || stateRes.status === 403) {
          const errData = await stateRes.json().catch(() => ({}));
          throw new Error(errData.message || 'Unauthorized or secondary team representative access denied.');
        }
        throw new Error('Failed to load competition state.');
      }
      const stateData = await stateRes.json();
      setRoundState(stateData.state);
      setRemainingSeconds(stateData.remainingSeconds || 0);

      // 2. Fetch Questions
      const questionsRes = await fetch('/api/round1/questions');
      if (!questionsRes.ok) throw new Error('Failed to load questions.');
      const questionsData: Question[] = await questionsRes.json();
      setQuestions(questionsData);

      // 3. Fetch Saved Answers
      const answersRes = await fetch('/api/round1/answers');
      if (answersRes.ok) {
        const answersData = await answersRes.json();
        setSelectedAnswers(answersData.answers || {});
        setIsSubmitted(answersData.isSubmitted || false);
        setSubmittedAt(answersData.submittedAt || null);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while connecting to Round 1.');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];

  const handleOptionSelect = async (optionId: string) => {
    if (isSubmitted || roundState !== 'ACTIVE') return;

    const questionId = currentQuestion.id;
    const updated = { ...selectedAnswers, [questionId]: optionId };
    setSelectedAnswers(updated);

    // Persist answer server-side
    try {
      setSaving(true);
      await fetch('/api/round1/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          selectedOptionId: optionId,
        }),
      });
    } catch (e) {
      console.error('Error auto-saving answer:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleFinalSubmit = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/round1/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: true }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to submit.');
      }

      const data = await res.json();
      setIsSubmitted(true);
      setSubmittedAt(data.submittedAt);
      setShowSubmitModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to record final submission.');
    } finally {
      setSaving(false);
    }
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bgApp text-textPrimary font-mono">
        <div className="flex items-center space-x-3 text-accentCyan">
          <div className="w-4 h-4 rounded-full border-2 border-accentCyan border-t-transparent animate-spin" />
          <span>INITIALIZING ROUND 1 ARENA...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 bg-bgApp text-textPrimary">
        <div className="max-w-md w-full p-6 rounded-lg bg-bgSurfaceBase border border-accentRed/40 text-center space-y-4">
          <div className="text-3xl">⚠️</div>
          <h2 className="text-xl font-bold text-accentRed">Round 1 Access Error</h2>
          <p className="text-sm text-textSecondary">{error}</p>
          <button
            onClick={() => router.push('/participant/dashboard')}
            className="px-4 py-2 bg-bgSurfaceHover hover:bg-bgSurfaceActive rounded text-xs font-mono text-textPrimary transition-colors"
          >
            RETURN TO DASHBOARD
          </button>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(selectedAnswers).length;
  const unansweredCount = Math.max(0, questions.length - answeredCount);

  return (
    <div className="min-h-screen bg-bgApp text-textPrimary flex flex-col font-sans">
      {/* 1. Header Bar */}
      <header className="px-6 py-4 bg-bgSurfaceBase border-b border-borderSubtle flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-4">
          <span className="text-xs font-mono text-accentCyan uppercase tracking-widest px-2.5 py-1 rounded bg-accentCyan/10 border border-accentCyan/30">
            ROUND 1 — CODE IQ
          </span>
          <h1 className="text-lg font-bold text-textPrimary hidden sm:block">Speed MCQ Competition</h1>
        </div>

        {/* Timer & Connection Badge */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-accentGreen animate-pulse' : 'bg-accentRed'}`} />
            <span className="text-xs font-mono text-textMuted uppercase">
              {isConnected ? 'LIVE SERVER' : 'RECONNECTING'}
            </span>
          </div>

          <div className="px-4 py-1.5 rounded bg-bgSurfaceHover border border-borderSubtle font-mono text-xl font-bold tracking-wider text-accentCyan">
            ⏱️ {formatTimer(remainingSeconds)}
          </div>
        </div>
      </header>

      {/* 2. Main Content Grid */}
      <div className="flex-1 p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left / Center: Question View (3 cols) */}
        <main className="lg:col-span-3 space-y-6 flex flex-col justify-between">
          {isSubmitted ? (
            /* Submitted Read-only View */
            <div className="p-8 rounded-lg bg-bgSurfaceBase border border-accentGreen/30 text-center space-y-4 my-auto">
              <div className="text-4xl">🔒</div>
              <h2 className="text-2xl font-extrabold text-accentGreen">SUBMISSION LOCKED & IMMUTABLE</h2>
              <p className="text-sm text-textSecondary max-w-md mx-auto">
                Your Round 1 responses have been recorded on the server and finalized.
              </p>
              {submittedAt && (
                <div className="inline-block px-4 py-2 rounded bg-bgSurfaceHover font-mono text-xs text-textMuted border border-borderSubtle">
                  Official Submission Timestamp: {new Date(submittedAt).toLocaleString()}
                </div>
              )}
              <div className="pt-4 text-xs font-mono text-accentCyan">
                Please wait for the organizer to conclude Round 1 and release results.
              </div>
            </div>
          ) : currentQuestion ? (
            /* Active Question Card */
            <div className="p-6 rounded-lg bg-bgSurfaceBase border border-borderSubtle space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Question Info Header */}
                <div className="flex items-center justify-between border-b border-borderSubtle pb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-mono font-bold text-accentCyan">
                      Question {currentIndex + 1} of {questions.length}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-bgSurfaceHover border border-borderSubtle font-mono text-textMuted">
                      {currentQuestion.type}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-accentGreen bg-accentGreen/10 border border-accentGreen/20 px-2 py-0.5 rounded">
                    +{currentQuestion.marks} Marks
                  </span>
                </div>

                {/* Problem Statement */}
                <div className="text-base font-medium text-textPrimary leading-relaxed whitespace-pre-wrap">
                  {currentQuestion.problemStatement}
                </div>

                {/* Code Snippet if present */}
                {currentQuestion.codeSnippet && (
                  <div className="p-4 rounded-md bg-bgApp border border-borderSubtle font-mono text-xs text-textPrimary overflow-x-auto">
                    <pre>{currentQuestion.codeSnippet}</pre>
                  </div>
                )}

                {/* MCQ Options List */}
                <div className="space-y-3 pt-2">
                  {currentQuestion.options.map((opt) => {
                    const isSelected = selectedAnswers[currentQuestion.id] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleOptionSelect(opt.id)}
                        disabled={isSubmitted || roundState !== 'ACTIVE'}
                        className={`w-full text-left p-4 rounded-lg border transition-all flex items-start space-x-3 ${
                          isSelected
                            ? 'bg-accentCyan/10 border-accentCyan text-textPrimary shadow-sm'
                            : 'bg-bgSurfaceHover/50 border-borderSubtle hover:border-accentCyan/50 text-textSecondary'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 mt-0.5 ${
                            isSelected ? 'bg-accentCyan text-bgApp' : 'bg-bgSurfaceActive text-textMuted'
                          }`}
                        >
                          {opt.label}
                        </span>
                        <div className="text-sm leading-relaxed flex-1">{opt.content}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center justify-between pt-6 border-t border-borderSubtle">
                <button
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 rounded bg-bgSurfaceHover hover:bg-bgSurfaceActive disabled:opacity-40 text-xs font-mono text-textPrimary transition-colors"
                >
                  ← PREVIOUS
                </button>

                <div className="text-xs font-mono text-textMuted">
                  {saving ? 'Saving...' : 'Auto-saved'}
                </div>

                <div className="flex items-center space-x-3">
                  {currentIndex < questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                      className="px-4 py-2 rounded bg-accentCyan text-bgApp hover:bg-accentCyan/90 font-mono text-xs font-bold transition-colors"
                    >
                      NEXT →
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowSubmitModal(true)}
                      className="px-5 py-2 rounded bg-accentGreen text-bgApp hover:bg-accentGreen/90 font-mono text-xs font-bold tracking-wider transition-colors shadow-md"
                    >
                      SUBMIT ROUND 1
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </main>

        {/* Right Sidebar: Question Navigator (1 col) */}
        <aside className="p-6 rounded-lg bg-bgSurfaceBase border border-borderSubtle space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-textMuted">Question Navigator</h3>

            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = Boolean(selectedAnswers[q.id]);
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded font-mono text-xs font-bold transition-all relative ${
                      isCurrent
                        ? 'border-2 border-accentCyan text-accentCyan bg-accentCyan/10'
                        : isAnswered
                        ? 'bg-accentGreen/20 border border-accentGreen/40 text-accentGreen'
                        : 'bg-bgSurfaceHover border border-borderSubtle text-textMuted hover:border-textSecondary'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2 pt-4 border-t border-borderSubtle text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-textMuted">Answered:</span>
                <span className="text-accentGreen font-bold">{answeredCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-textMuted">Unanswered:</span>
                <span className="text-accentRed font-bold">{unansweredCount}</span>
              </div>
            </div>
          </div>

          {!isSubmitted && (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-3 rounded bg-accentGreen text-bgApp hover:bg-accentGreen/90 font-mono text-xs font-bold tracking-wider uppercase transition-colors"
            >
              FINALIZE SUBMISSION
            </button>
          )}
        </aside>
      </div>

      {/* 3. Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full p-6 rounded-lg bg-bgSurfaceBase border border-borderSubtle space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-textPrimary">Confirm Final Submission</h3>
              <p className="text-xs text-textSecondary">
                Are you ready to submit your Round 1 answers? Once submitted, your responses are final and immutable.
              </p>
            </div>

            <div className="p-4 rounded bg-bgApp border border-borderSubtle space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-textMuted">Total Questions:</span>
                <span className="text-textPrimary">{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-textMuted">Answered:</span>
                <span className="text-accentGreen font-bold">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-textMuted">Unanswered:</span>
                <span className="text-accentRed font-bold">{unansweredCount}</span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="p-3 rounded bg-accentRed/10 border border-accentRed/30 text-xs text-accentRed font-mono">
                ⚠️ You have {unansweredCount} unanswered question(s). Unanswered questions receive 0 marks.
              </div>
            )}

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded bg-bgSurfaceHover hover:bg-bgSurfaceActive text-xs font-mono text-textPrimary"
              >
                CANCEL
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={saving}
                className="px-4 py-2 rounded bg-accentGreen text-bgApp hover:bg-accentGreen/90 font-mono text-xs font-bold"
              >
                {saving ? 'SUBMITTING...' : 'CONFIRM SUBMIT'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
