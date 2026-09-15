'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ScoringPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/organizer/rounds');
  }, [router]);

  return (
    <div className="p-6 font-mono text-xs text-textMuted">
      Redirecting to Competition Round Control Center...
    </div>
  );
}
