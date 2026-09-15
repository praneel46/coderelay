'use client';

export default function OrganizerResultsPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-textPrimary">Competition Results & Standings</h1>
        <p className="text-sm text-textSecondary mt-1">
          Final scores, leaderboards, and qualification statuses per round
        </p>
      </div>

      <div className="p-8 text-center rounded-lg bg-bgSurfaceBase border border-borderSubtle space-y-3">
        <span className="text-3xl">🏆</span>
        <h3 className="font-bold text-lg text-textPrimary">Results Configuration Ready</h3>
        <p className="text-sm text-textMuted max-w-md mx-auto">
          Leaderboard and final scoring calculations will be processed during live competition rounds (Phases 6–13).
        </p>
      </div>
    </div>
  );
}
