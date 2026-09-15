'use client';

import Link from 'next/link';

export default function OrganizerDashboardPage() {
  const metrics = [
    { label: 'Registered Teams', value: '2', sub: 'ALPHA-042, BETA-099', href: '/organizer/teams' },
    { label: 'Competition Rounds', value: '4', sub: 'Round 1-4 Configured', href: '/organizer/rounds' },
    { label: 'Question Bank Total', value: '12', sub: 'MCQ, Debugging, Coding', href: '/organizer/questions' },
    { label: 'Published Questions', value: '8', sub: 'Ready for Competition', href: '/organizer/questions?status=PUBLISHED' },
    { label: 'Locked Questions', value: '4', sub: 'Immutable Production State', href: '/organizer/questions?status=LOCKED' },
    { label: 'Recent Submissions', value: '0', sub: 'Pre-competition Phase', href: '/organizer/submissions' },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-textPrimary">Organizer Control Console</h1>
        <p className="text-sm text-textSecondary mt-1">
          VIDYANTRA 2026 Code Relay Administrative Overview & Content Management
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((m) => (
          <Link
            key={m.label}
            href={m.href}
            className="p-5 rounded-lg bg-bgSurfaceBase border border-borderSubtle hover:border-accentCyan/50 transition-all group"
          >
            <span className="text-xs font-mono uppercase text-textMuted">{m.label}</span>
            <div className="text-3xl font-extrabold text-textPrimary mt-2 group-hover:text-accentCyan transition-colors">
              {m.value}
            </div>
            <span className="text-xs text-textSecondary mt-1 block">{m.sub}</span>
          </Link>
        ))}
      </div>

      {/* Action Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-lg bg-bgSurfaceBase border border-borderSubtle space-y-3">
          <h3 className="font-bold text-lg text-textPrimary flex items-center space-x-2">
            <span>📝</span>
            <span>Question Bank Management</span>
          </h3>
          <p className="text-sm text-textSecondary">
            Create, edit, publish, lock, and preview questions for Rounds 1 through 4.
          </p>
          <div className="pt-2 flex items-center space-x-3">
            <Link
              href="/organizer/questions/new"
              className="px-4 py-2 text-xs font-bold uppercase rounded bg-accentCyan text-bgApp hover:bg-accentCyan/90 transition-colors"
            >
              + Create New Question
            </Link>
            <Link
              href="/organizer/questions"
              className="px-4 py-2 text-xs font-bold uppercase rounded bg-bgSurfaceElevated text-textPrimary border border-borderSubtle hover:bg-bgSurfaceBase transition-colors"
            >
              View Question Bank
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-bgSurfaceBase border border-borderSubtle space-y-3">
          <h3 className="font-bold text-lg text-textPrimary flex items-center space-x-2">
            <span>👥</span>
            <span>Team Roster & Security</span>
          </h3>
          <p className="text-sm text-textSecondary">
            View registered teams, member PIN statuses, and manage session revocations.
          </p>
          <div className="pt-2 flex items-center space-x-3">
            <Link
              href="/organizer/teams"
              className="px-4 py-2 text-xs font-bold uppercase rounded bg-bgSurfaceElevated text-textPrimary border border-borderSubtle hover:bg-bgSurfaceBase transition-colors"
            >
              Manage Teams
            </Link>
            <Link
              href="/organizer/audit"
              className="px-4 py-2 text-xs font-bold uppercase rounded bg-bgSurfaceElevated text-textPrimary border border-borderSubtle hover:bg-bgSurfaceBase transition-colors"
            >
              Audit Logs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
