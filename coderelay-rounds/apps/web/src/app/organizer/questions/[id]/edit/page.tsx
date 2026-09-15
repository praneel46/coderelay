'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function EditQuestionPage() {
  const params = useParams();
  const id = params?.id as string;

  const [title, setTitle] = useState('Time Complexity of Binary Search');
  const [description, setDescription] = useState(
    'What is the worst-case time complexity of binary search on a sorted array of N elements?',
  );
  const [type] = useState('MCQ');
  const [points, setPoints] = useState(10);
  const [status] = useState('DRAFT');

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Edit Question ({id})</h1>
          <p className="text-sm text-textSecondary mt-1">
            Update problem statement, options, or publish status
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
        <div className="flex items-center justify-between bg-bgSurfaceElevated p-3 rounded border border-borderSubtle text-xs font-mono">
          <span>Current Status: <strong className="text-statusWarning">{status}</strong></span>
          <div className="space-x-2">
            <button
              type="button"
              className="px-3 py-1 rounded bg-statusSuccess text-bgApp font-bold hover:bg-statusSuccess/90"
            >
              Publish Question
            </button>
            <button
              type="button"
              className="px-3 py-1 rounded bg-statusError/20 text-statusError border border-statusError/30 font-bold hover:bg-statusError/30"
            >
              Lock Question
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-mono font-bold uppercase text-textMuted">Question Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded bg-bgSurfaceElevated border border-borderSubtle text-sm text-textPrimary focus:outline-none focus:border-accentCyan/50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-mono font-bold uppercase text-textMuted">Question Type</label>
            <input
              type="text"
              disabled
              value={type}
              className="w-full px-3 py-2 rounded bg-bgSurfaceElevated/50 border border-borderSubtle text-sm text-textMuted cursor-not-allowed"
            />
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
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 rounded bg-bgSurfaceElevated border border-borderSubtle text-sm text-textPrimary focus:outline-none focus:border-accentCyan/50"
          />
        </div>

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
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
