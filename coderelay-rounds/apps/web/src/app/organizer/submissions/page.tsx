'use client';

export default function OrganizerSubmissionsPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-textPrimary">Submissions Overview</h1>
        <p className="text-sm text-textSecondary mt-1">
          Submitted participant answers and code snapshots across rounds
        </p>
      </div>

      <div className="p-8 text-center rounded-lg bg-bgSurfaceBase border border-borderSubtle space-y-3">
        <span className="text-3xl">📥</span>
        <h3 className="font-bold text-lg text-textPrimary">No Submissions Available</h3>
        <p className="text-sm text-textMuted max-w-md mx-auto">
          Competition submissions will appear here live once participants begin submitting answers during active rounds.
        </p>
      </div>
    </div>
  );
}
