'use client';

import Link from 'next/link';

export default function JudgeEvaluationsPage() {
  return (
    <div className="min-h-screen bg-bgApp bg-tech-grid text-textPrimary p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-borderMedium/80 pb-4">
          <div>
            <div className="text-[10px] font-mono text-accentCyan uppercase tracking-widest bg-accentCyan/10 px-3 py-1 rounded inline-block">
              VIDYANTRA 2026 // RUBRIC EVALUATION
            </div>
            <h1 className="text-3xl font-extrabold font-mono text-textPrimary uppercase tracking-tight mt-2">
              EVALUATION WORKSPACE
            </h1>
          </div>
          <Link href="/judge/dashboard" className="text-xs font-mono text-textMuted hover:text-accentCyan transition-colors">
            ← BACK TO DASHBOARD
          </Link>
        </div>

        <div className="p-8 rounded-xl bg-bgSurfaceBase/90 border border-borderMedium glass-panel text-center space-y-4">
          <div className="text-xs font-mono text-textMuted uppercase tracking-wider">
            AUTOMATED EVALUATION ACTIVE — NO MANUAL RUBRIC GRADING REQUIRED
          </div>
        </div>
      </div>
    </div>
  );
}
