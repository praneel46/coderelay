'use client';

export default function OrganizerTeamsPage() {
  const sampleTeams = [
    {
      id: 'team-1',
      teamCode: 'ALPHA-042',
      name: 'Team Alpha Byte',
      college: 'Vidyantra Institute of Tech',
      status: 'Active',
      members: [
        { order: 1, name: 'Alice (Debugger)', pinStatus: 'Hashed (bcrypt)' },
        { order: 2, name: 'Bob (Coder)', pinStatus: 'Hashed (bcrypt)' },
        { order: 3, name: 'Charlie (Predictor)', pinStatus: 'Hashed (bcrypt)' },
      ],
    },
    {
      id: 'team-2',
      teamCode: 'BETA-099',
      name: 'Team Beta Syntax',
      college: 'Vidyantra School of Engineering',
      status: 'Active',
      members: [
        { order: 1, name: 'David (Debugger)', pinStatus: 'Hashed (bcrypt)' },
        { order: 2, name: 'Eve (Coder)', pinStatus: 'Hashed (bcrypt)' },
        { order: 3, name: 'Frank (Predictor)', pinStatus: 'Hashed (bcrypt)' },
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Team Management</h1>
          <p className="text-sm text-textSecondary mt-1">
            Registered competition teams and member credentials
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {sampleTeams.map((t) => (
          <div
            key={t.id}
            className="p-5 rounded-lg bg-bgSurfaceBase border border-borderSubtle space-y-4"
          >
            <div className="flex items-center justify-between border-b border-borderSubtle pb-3">
              <div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-accentCyan/10 text-accentCyan border border-accentCyan/20 mr-3">
                  {t.teamCode}
                </span>
                <span className="font-bold text-textPrimary">{t.name}</span>
                <span className="text-xs text-textMuted ml-3 font-mono">
                  ({t.college})
                </span>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-statusSuccess/10 text-statusSuccess border border-statusSuccess/20">
                {t.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {t.members.map((m) => (
                <div
                  key={m.order}
                  className="p-3 rounded bg-bgSurfaceElevated border border-borderSubtle text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-mono font-bold text-textMuted">
                    <span>Member {m.order}</span>
                    <span className="text-[10px] text-accentCyan">PIN Hash Verified</span>
                  </div>
                  <div className="font-semibold text-textPrimary">{m.name}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
