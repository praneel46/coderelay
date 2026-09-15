'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function OrganizerQuestionsPage() {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const sampleQuestions = [
    {
      id: 'q-101',
      title: 'Time Complexity of Binary Search',
      round: 'Round 1 (MCQ)',
      type: 'MCQ',
      points: 10,
      status: 'PUBLISHED',
      updatedAt: '2026-09-14 10:00',
    },
    {
      id: 'q-102',
      title: 'Off-by-One Pointer Bug',
      round: 'Round 2 — Stage 1 (Member 1)',
      type: 'DEBUGGING',
      points: 15,
      status: 'PUBLISHED',
      updatedAt: '2026-09-14 10:15',
    },
    {
      id: 'q-103',
      title: 'Reverse Linked List in O(1) Space',
      round: 'Round 2 — Stage 2 (Member 2)',
      type: 'CODING',
      points: 20,
      status: 'LOCKED',
      updatedAt: '2026-09-14 09:30',
    },
    {
      id: 'q-104',
      title: 'Closure Scoping Predict Output',
      round: 'Round 2 — Stage 3 (Member 3)',
      type: 'PREDICT_OUTPUT',
      points: 10,
      status: 'DRAFT',
      updatedAt: '2026-09-14 11:20',
    },
  ];

  const filtered = sampleQuestions.filter((q) => {
    if (filterStatus !== 'ALL' && q.status !== filterStatus) return false;
    if (
      searchQuery &&
      !q.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Question Bank</h1>
          <p className="text-sm text-textSecondary mt-1">
            Manage problem bank, question lifecycle, publishing, and locking
          </p>
        </div>
        <Link
          href="/organizer/questions/new"
          className="px-4 py-2 text-xs font-bold uppercase rounded bg-accentCyan text-bgApp hover:bg-accentCyan/90 transition-colors"
        >
          + Create Question
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-bgSurfaceBase border border-borderSubtle">
        <input
          type="text"
          placeholder="Search questions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-2 rounded bg-bgSurfaceElevated border border-borderSubtle text-sm text-textPrimary focus:outline-none focus:border-accentCyan/50 w-full md:w-80"
        />

        <div className="flex items-center space-x-2">
          {['ALL', 'DRAFT', 'PUBLISHED', 'LOCKED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all ${
                filterStatus === st
                  ? 'bg-accentCyan text-bgApp'
                  : 'bg-bgSurfaceElevated text-textMuted border border-borderSubtle hover:text-textPrimary'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Questions Table */}
      <div className="rounded-lg bg-bgSurfaceBase border border-borderSubtle overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-borderSubtle text-xs font-mono uppercase text-textMuted bg-bgSurfaceElevated">
              <th className="p-3.5">Title</th>
              <th className="p-3.5">Round / Scope</th>
              <th className="p-3.5">Type</th>
              <th className="p-3.5">Points</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderSubtle text-sm">
            {filtered.map((q) => (
              <tr key={q.id} className="hover:bg-bgSurfaceElevated/50 transition-colors">
                <td className="p-3.5 font-semibold text-textPrimary">{q.title}</td>
                <td className="p-3.5 text-xs font-mono text-textSecondary">{q.round}</td>
                <td className="p-3.5 text-xs font-mono text-accentCyan">{q.type}</td>
                <td className="p-3.5 text-xs font-mono font-bold text-textPrimary">
                  {q.points} pts
                </td>
                <td className="p-3.5">
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded border ${
                      q.status === 'PUBLISHED'
                        ? 'bg-statusSuccess/10 text-statusSuccess border-statusSuccess/20'
                        : q.status === 'LOCKED'
                        ? 'bg-statusError/10 text-statusError border-statusError/20'
                        : 'bg-statusWarning/10 text-statusWarning border-statusWarning/20'
                    }`}
                  >
                    {q.status}
                  </span>
                </td>
                <td className="p-3.5 text-right space-x-2 text-xs font-mono">
                  <Link
                    href={`/organizer/questions/${q.id}/preview`}
                    className="text-textSecondary hover:text-accentCyan"
                  >
                    Preview
                  </Link>
                  {q.status !== 'LOCKED' ? (
                    <Link
                      href={`/organizer/questions/${q.id}/edit`}
                      className="text-accentCyan hover:underline"
                    >
                      Edit
                    </Link>
                  ) : (
                    <span className="text-textMuted cursor-not-allowed">Locked</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
