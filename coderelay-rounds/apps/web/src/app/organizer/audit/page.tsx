'use client';

export default function OrganizerAuditPage() {
  const auditLogs = [
    {
      id: 'log-1',
      timestamp: '2026-09-14 17:10:49',
      actor: 'organizer (ORGANIZER)',
      action: 'PUBLISH_QUESTION',
      resource: 'Question (q-101)',
      metadata: 'Title: Time Complexity of Binary Search',
    },
    {
      id: 'log-2',
      timestamp: '2026-09-14 17:08:15',
      actor: 'organizer (ORGANIZER)',
      action: 'LOGIN',
      resource: 'Auth',
      metadata: 'Privileged console authentication',
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-textPrimary">Audit Trail</h1>
        <p className="text-sm text-textSecondary mt-1">
          Historical log of administrative operations and question updates
        </p>
      </div>

      <div className="rounded-lg bg-bgSurfaceBase border border-borderSubtle overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-borderSubtle text-xs font-mono uppercase text-textMuted bg-bgSurfaceElevated">
              <th className="p-3.5">Timestamp</th>
              <th className="p-3.5">Actor</th>
              <th className="p-3.5">Action</th>
              <th className="p-3.5">Resource</th>
              <th className="p-3.5">Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderSubtle text-xs font-mono">
            {auditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-bgSurfaceElevated/50 transition-colors">
                <td className="p-3.5 text-textMuted">{log.timestamp}</td>
                <td className="p-3.5 font-bold text-accentCyan">{log.actor}</td>
                <td className="p-3.5 font-bold text-textPrimary">{log.action}</td>
                <td className="p-3.5 text-textSecondary">{log.resource}</td>
                <td className="p-3.5 text-textMuted">{log.metadata}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
