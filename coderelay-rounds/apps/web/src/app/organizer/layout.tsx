import Link from 'next/link';

export default function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { label: 'Dashboard', href: '/organizer/dashboard', icon: '📊' },
    { label: 'Teams', href: '/organizer/teams', icon: '👥' },
    { label: 'Rounds', href: '/organizer/rounds', icon: '⚡' },
    { label: 'Question Bank', href: '/organizer/questions', icon: '📝' },
    { label: 'Submissions', href: '/organizer/submissions', icon: '📥' },
    { label: 'Results', href: '/organizer/results', icon: '🏆' },
    { label: 'Audit Trail', href: '/organizer/audit', icon: '📜' },
  ];

  return (
    <div className="min-h-screen flex bg-bgApp text-textPrimary font-sans bg-tech-grid">
      {/* Sidebar */}
      <aside className="w-64 border-r border-borderMedium/80 bg-bgSurfaceBase/95 flex flex-col justify-between shrink-0 glass-panel">
        <div>
          <div className="p-5 border-b border-borderSubtle flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-sm tracking-wider uppercase text-textPrimary font-mono">
                CODE RELAY
              </h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-accentCyan/10 text-accentCyan border border-accentCyan/30 font-semibold tracking-wider">
                ORGANIZER CONSOLE
              </span>
            </div>
          </div>
          <nav className="p-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-mono text-textSecondary hover:text-accentCyan hover:bg-bgSurfaceElevated border border-transparent hover:border-accentCyan/30 transition-all group"
              >
                <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
                <span className="font-semibold tracking-wide uppercase">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-borderSubtle">
          <div className="flex items-center space-x-2.5 text-[11px] text-textMuted font-mono">
            <span className="w-2 h-2 rounded-full bg-statusSuccess animate-status-pulse"></span>
            <span className="uppercase tracking-wider">SERVER AUTHORITATIVE ENGINE</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-borderMedium/80 bg-bgSurfaceBase/90 px-6 flex items-center justify-between glass-panel">
          <div className="flex items-center space-x-2 text-xs font-mono text-textMuted uppercase tracking-wider">
            <span className="text-accentCyan font-bold">VIDYANTRA 2026</span>
            <span>/</span>
            <span className="text-textSecondary font-semibold">EVENT CONTROL CENTER</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-[11px] px-3 py-1 rounded-full bg-bgSurfaceElevated border border-accentCyan/30 text-accentCyan font-mono font-bold tracking-wider uppercase glow-cyan-sm">
              ROLE: ORGANIZER
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
