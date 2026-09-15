'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function NewQuestionPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('MCQ');
  const [points, setPoints] = useState(10);
  const [options, setOptions] = useState([
    { label: 'A', content: '', isCorrect: true },
    { label: 'B', content: '', isCorrect: false },
    { label: 'C', content: '', isCorrect: false },
    { label: 'D', content: '', isCorrect: false },
  ]);
  const [initialCode, setInitialCode] = useState('');

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Create New Question</h1>
          <p className="text-sm text-textSecondary mt-1">
            Draft a new question for Round 1, Round 2, or Finale
          </p>
        </div>
        <Link
          href="/organizer/questions"
          className="px-3 py-1.5 text-xs font-mono text-textMuted border border-borderSubtle rounded hover:text-textPrimary"
        >
          ← Back to Question Bank
        </Link>
      </div>

      <form className="p-6 rounded-lg bg-bgSurfaceBase border border-borderSubtle space-y-5">
        <div className="space-y-1">
          <label className="text-xs font-mono font-bold uppercase text-textMuted">Question Title</label>
          <input
            type="text"
            required
            placeholder="e.g. Time Complexity of Binary Search"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded bg-bgSurfaceElevated border border-borderSubtle text-sm text-textPrimary focus:outline-none focus:border-accentCyan/50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-mono font-bold uppercase text-textMuted">Question Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 rounded bg-bgSurfaceElevated border border-borderSubtle text-sm text-textPrimary focus:outline-none focus:border-accentCyan/50"
            >
              <option value="MCQ">MCQ (Round 1 / Round 2 M3)</option>
              <option value="DEBUGGING">DEBUGGING (Round 2 M1)</option>
              <option value="CODING">CODING (Round 2 M2)</option>
              <option value="PREDICT_OUTPUT">PREDICT_OUTPUT (Round 2 M3)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-bold uppercase text-textMuted">Points / Marks</label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="w-full px-3 py-2 rounded bg-bgSurfaceElevated border border-borderSubtle text-sm text-textPrimary focus:outline-none focus:border-accentCyan/50"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-mono font-bold uppercase text-textMuted">Problem Statement</label>
          <textarea
            rows={4}
            required
            placeholder="Detailed description of the problem..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 rounded bg-bgSurfaceElevated border border-borderSubtle text-sm text-textPrimary focus:outline-none focus:border-accentCyan/50"
          />
        </div>

        {/* Dynamic MCQ Options Builder */}
        {(type === 'MCQ' || type === 'PREDICT_OUTPUT') && (
          <div className="space-y-3 pt-2">
            <label className="text-xs font-mono font-bold uppercase text-textMuted">
              MCQ Options (Designate exactly 1 correct answer)
            </label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center space-x-3">
                  <span className="w-6 font-mono font-bold text-xs text-accentCyan text-center">
                    {opt.label}
                  </span>
                  <input
                    type="text"
                    placeholder={`Option ${opt.label} text`}
                    value={opt.content}
                    onChange={(e) => {
                      const updated = [...options];
                      updated[idx].content = e.target.value;
                      setOptions(updated);
                    }}
                    className="flex-1 px-3 py-1.5 rounded bg-bgSurfaceElevated border border-borderSubtle text-sm text-textPrimary focus:outline-none focus:border-accentCyan/50"
                  />
                  <label className="flex items-center space-x-2 text-xs font-mono cursor-pointer">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={opt.isCorrect}
                      onChange={() => {
                        const updated = options.map((o, i) => ({
                          ...o,
                          isCorrect: i === idx,
                        }));
                        setOptions(updated);
                      }}
                      className="accent-accentCyan"
                    />
                    <span className={opt.isCorrect ? 'text-statusSuccess font-bold' : 'text-textMuted'}>
                      Correct
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Starter Code Editor for Debugging / Coding */}
        {(type === 'DEBUGGING' || type === 'CODING') && (
          <div className="space-y-1 pt-2">
            <label className="text-xs font-mono font-bold uppercase text-textMuted">
              Starter Code / Buggy Snippet
            </label>
            <textarea
              rows={6}
              placeholder="// Enter starter code or buggy code snippet..."
              value={initialCode}
              onChange={(e) => setInitialCode(e.target.value)}
              className="w-full px-3 py-2 rounded bg-bgSurfaceElevated border border-borderSubtle text-xs font-mono text-textPrimary focus:outline-none focus:border-accentCyan/50"
            />
          </div>
        )}

        <div className="pt-4 flex items-center justify-end space-x-3">
          <Link
            href="/organizer/questions"
            className="px-4 py-2 text-xs font-mono text-textMuted hover:text-textPrimary"
          >
            Cancel
          </Link>
          <button
            type="button"
            className="px-5 py-2 text-xs font-bold uppercase rounded bg-accentCyan text-bgApp hover:bg-accentCyan/90 transition-colors"
          >
            Save as DRAFT
          </button>
        </div>
      </form>
    </div>
  );
}
