import Link from 'next/link';

export default function Home() {
  return (
    <main
      className="relative flex min-h-screen w-full flex-col items-center justify-center px-5 py-8 bg-[#03070A] overflow-hidden select-none"
      style={{
        backgroundImage: "url('/images/hero-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Subtle Readability Overlay */}
      <div className="absolute inset-0 bg-[#000508]/22 pointer-events-none" />

      {/* Main Hero Container */}
      <div className="relative z-10 flex w-full max-w-[760px] flex-col items-center text-center pt-[10vh] pb-[6vh] animate-fade-in">
        
        {/* Event Identifier */}
        <div className="mb-6 text-[14px] font-mono font-medium uppercase tracking-[0.40em] text-primaryCyan glow-vidyantra">
          VIDYANTRA 2026
        </div>

        {/* Small Horizontal Divider */}
        <div className="mb-9 h-[1px] w-8 bg-white/65" />

        {/* Primary Title: CODE RELAY */}
        <h1 className="mb-6 flex flex-col items-center justify-center font-display font-black text-[clamp(64px,9vw,140px)] leading-[0.86] tracking-tighterHeading uppercase">
          <span className="text-textPrimary">CODE</span>
          <span className="bg-gradient-to-r from-[#E8FCFF] via-[#16D9F5] to-[#08BBD8] bg-clip-text text-transparent glow-relay">
            RELAY
          </span>
        </h1>

        {/* Event Tagline */}
        <p className="mb-8 font-mono text-[13px] sm:text-[14px] font-normal uppercase tracking-[0.30em] text-[#F5FAFC]/90">
          THINK . CODE . DEBUG . RELAY
        </p>

        {/* Primary Participant CTA */}
        <div className="w-full max-w-[450px] animate-fade-in-delayed">
          <Link
            href="/team-entry"
            className="group relative flex h-[60px] w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#0ED0EC] to-[#21DDF5] font-mono text-[15px] font-bold uppercase tracking-[0.10em] text-[#031014] btn-primary-glow transition-all duration-200 ease-out hover:-translate-y-[1px]"
          >
            <span className="flex items-center gap-2">
              JOIN AS PARTICIPANT
              <svg
                className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </span>
          </Link>
        </div>

        {/* OR Divider */}
        <div className="my-8 flex w-full max-w-[340px] items-center justify-center animate-fade-in-delayed">
          <div className="h-[1px] flex-1 bg-[#B4DCE6]/25" />
          <span className="px-4 font-mono text-[11px] uppercase tracking-[0.25em] text-[#DCEBF0]/55">
            OR
          </span>
          <div className="h-[1px] flex-1 bg-[#B4DCE6]/25" />
        </div>

        {/* System Portal Buttons */}
        <div className="flex w-full max-w-[840px] flex-col sm:flex-row items-center justify-center gap-3.5 animate-fade-in-delayed-2">
          {/* Host Display */}
          <Link
            href="/host/display"
            className="group flex h-[54px] w-full sm:w-auto flex-1 items-center justify-center gap-2.5 rounded-lg border border-[#0FC3DC]/48 bg-[#020A0E]/48 px-5 font-mono text-[12px] sm:text-[13px] font-medium uppercase tracking-[0.12em] text-textSecondary backdrop-blur-md transition-all duration-200 ease-out hover:border-[#14D9F5]/85 hover:bg-[#041419]/68 portal-card-glow hover:-translate-y-[1px]"
          >
            <svg
              className="h-5 w-5 stroke-textSecondary transition-colors group-hover:stroke-primaryCyan"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <rect x="2" y="3" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="8" y1="21" x2="16" y2="21" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="12" y1="17" x2="12" y2="21" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>HOST DISPLAY</span>
            <span className="text-primaryCyan transition-transform duration-200 group-hover:translate-x-1">→</span>
          </Link>

          {/* Judge Portal */}
          <Link
            href="/judge/dashboard"
            className="group flex h-[54px] w-full sm:w-auto flex-1 items-center justify-center gap-2.5 rounded-lg border border-[#0FC3DC]/48 bg-[#020A0E]/48 px-5 font-mono text-[12px] sm:text-[13px] font-medium uppercase tracking-[0.12em] text-textSecondary backdrop-blur-md transition-all duration-200 ease-out hover:border-[#14D9F5]/85 hover:bg-[#041419]/68 portal-card-glow hover:-translate-y-[1px]"
          >
            <svg
              className="h-5 w-5 stroke-textSecondary transition-colors group-hover:stroke-primaryCyan"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>JUDGE PORTAL</span>
            <span className="text-primaryCyan transition-transform duration-200 group-hover:translate-x-1">→</span>
          </Link>

          {/* Organizer Console */}
          <Link
            href="/organizer/dashboard"
            className="group flex h-[54px] w-full sm:w-auto flex-1 items-center justify-center gap-2.5 rounded-lg border border-[#0FC3DC]/48 bg-[#020A0E]/48 px-5 font-mono text-[12px] sm:text-[13px] font-medium uppercase tracking-[0.12em] text-textSecondary backdrop-blur-md transition-all duration-200 ease-out hover:border-[#14D9F5]/85 hover:bg-[#041419]/68 portal-card-glow hover:-translate-y-[1px]"
          >
            <svg
              className="h-5 w-5 stroke-textSecondary transition-colors group-hover:stroke-primaryCyan"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>ORGANIZER CONSOLE</span>
            <span className="text-primaryCyan transition-transform duration-200 group-hover:translate-x-1">→</span>
          </Link>
        </div>

      </div>
    </main>
  );
}

