'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ParticipantDashboard() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/participant/arena');
  }, [router]);

  return (
    <div className="p-6 font-mono text-xs text-textMuted">
      Redirecting to Participant Arena...
    </div>
  );
}
