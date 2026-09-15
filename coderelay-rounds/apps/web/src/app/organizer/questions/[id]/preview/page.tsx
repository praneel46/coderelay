'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function QuestionPreviewPage() {
  const params = useParams();
  const id = params?.id as string;
  const [viewMode, setViewMode] = useState<'PARTICIPANT' | 'ORGANIZER'>('PARTICIPANT');

  const question = {
    id: id || 'q-101',
    title: 'Time Complexity of Binary Search',
    description: 'What is the worst-case time complexity of binary search on a sorted array of N elements?',
    type: 'MCQ',
    points: 10,
    options: [
      { label: 'A', content: 'O(N)', isCorrect: false },
      { label: 'B', content: 'O(log N)', isCorrect: true },
      { label: 'C', content: 'O(N log N)', isCorrect: false },
      { label: 'D', content: 'O(1)', isCorrect: false },
    ],
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Question Preview</h1>
          <p className="text-sm text-textSecondary mt-1">
            Preview how participants see this question versus organizer answer key
          </p>
        </div>
        <Link
          href="/organizer/questions"
          className="px-3 py-1.5 text-xs font-mono text-textMuted border border-borderSubtle rounded hover:text-textPrimary"
        >
          ← Back to Question Bank
        </Link>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-bgSurfaceBase border border-borderSubtle">
        <span className="text-xs font-mono font-bold uppercase text-textMuted">Preview Mode:</span>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('PARTICIPANT')}
            className={`px-4 py-1.5 rounded text-xs font-mono font-bold transition-all ${
              viewMode === 'PARTICIPANT'
                ? 'bg-accentCyan text-bgApp'
                : 'bg-bgSurfaceElevated text-textMuted border border-borderSubtle'
            }`}
          >
            PARTICIPANT VIEW (Sanitized)
          </button>
          <button
            onClick={() => setViewMode('ORGANIZER')}
            className={`px-4 py-1.5 rounded text-xs font-mono font-bold transition-all ${
              viewMode === 'ORGANIZER'
                ? 'bg-statusSuccess text-bgApp'
                : 'bg-bgSurfaceElevated text-textMuted border border-borderSubtle'
            }`}
          >
            ORGANIZER KEY VIEW
          </button>
        </div>
      </div>

      {/* Question Card */}
      <div className="p-6 rounded-lg bg-bgSurfaceBase border border-borderSubtle space-y-5">
        <div className="flex items-center justify-between border-b border-borderSubtle pb-3">
          <span className="text-xs font-mono text-accentCyan font-bold">{question.type}</span>
          <span className="text-xs font-mono font-bold text-textPrimary">{question.points} Points</span>
        </div>

        <h2 className="text-lg font-bold text-textPrimary">{question.title}</h2>
        <p className="text-sm text-textSecondary leading-relaxed">{question.description}</p>

        <div className="space-y-2 pt-2">
          {question.options.map((opt) => (
            <div
              key={opt.label}
              className={`p-3 rounded border text-sm flex items-center justify-between ${
                viewMode === 'ORGANIZER' && opt.isCorrect
                  ? 'bg-statusSuccess/10 border-statusSuccess text-statusSuccess font-bold'
                  : 'bg-bgSurfaceElevated border-borderSubtle text-textPrimary'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="font-mono font-bold text-xs">{opt.label}.</span>
                <span>{opt.content}</span>
              </div>
              {viewMode === 'ORGANIZER' && opt.isCorrect && (
                <span className="text-xs font-mono uppercase bg-statusSuccess text-bgApp px-2 py-0.5 rounded font-bold">
                  Correct Answer
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
