'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/organizer/audit');
  }, [router]);

  return (
    <div className="p-6 font-mono text-xs text-textMuted">
      Redirecting to Audit Trail...
    </div>
  );
}
