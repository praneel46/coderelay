import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bgApp: '#03070A',
        bgSurfaceSecondary: '#071117',
        bgSurfaceDeep: '#050C10',
        primaryCyan: '#16D9F5',
        brightCyan: '#20DDF5',
        darkCyan: '#087F96',
        textPrimary: '#F3F7F8',
        textSecondary: '#D8E8EC',
        textMuted: 'rgba(190, 215, 222, 0.60)',
        textSubtle: 'rgba(190, 215, 222, 0.45)',
        borderCyan: 'rgba(22, 217, 245, 0.35)',
        borderBrightCyan: 'rgba(22, 217, 245, 0.70)',
        borderSubtleWhite: 'rgba(255, 255, 255, 0.12)',
        // Backwards compatibility tokens
        bgSurfaceBase: '#071117',
        bgSurfaceElevated: '#050C10',
        bgSurfaceOverlay: '#0a1721',
        borderSubtle: 'rgba(22, 217, 245, 0.25)',
        borderMedium: 'rgba(22, 217, 245, 0.45)',
        accentCyan: '#16D9F5',
        statusSuccess: '#10b981',
        statusWarning: '#f59e0b',
        statusDanger: '#ef4444',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Space Grotesk', 'Sora', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'IBM Plex Mono', 'JetBrains Mono', 'Space Mono', 'monospace'],
        sans: ['var(--font-display)', 'Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.06em',
        tighterHeading: '-0.055em',
        techLabel: '0.14em',
        metaUpper: '0.28em',
        vidyantra: '0.40em',
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
      },
      boxShadow: {
        cyanGlowSm: '0 0 15px rgba(22, 217, 245, 0.20)',
        cyanGlowMd: '0 0 25px rgba(22, 217, 245, 0.30)',
        cyanGlowLg: '0 0 40px rgba(22, 217, 245, 0.45)',
      },
    },
  },
  plugins: [],
};

export default config;

