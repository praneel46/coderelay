'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HostControlPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/host/display');
  }, [router]);

  return (
    <div className="p-6 font-mono text-xs text-textMuted">
      Redirecting to Arena Host Display...
    </div>
  );
}
