/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Theme-aware surfaces (flip between light-premium and dark via CSS variables — see index.css)
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        surface2: 'rgb(var(--color-surface-2) / <alpha-value>)',
        panel: 'rgb(var(--color-panel) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        hairline: 'rgb(var(--color-hairline) / <alpha-value>)',

        // Signature accent hues — same hue family in both themes for continuity, tuned per-theme for AA contrast
        coral: 'rgb(var(--color-coral) / <alpha-value>)',
        copperwarm: 'rgb(var(--color-copperwarm) / <alpha-value>)',
        plum: 'rgb(var(--color-plum) / <alpha-value>)',

        // Fixed (non-theme-swapping) tones for text/elements that sit on top of accent-colored fills
        onaccent: 'rgb(var(--color-onaccent) / <alpha-value>)',
        onaccentlight: 'rgb(var(--color-onaccent-light) / <alpha-value>)',
        plumfixed: 'rgb(var(--color-plum-fixed) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Space Grotesk"', '"Clash Display"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        // signature "rounded-sharp" corner: soft everywhere but one crisp corner
        card: '1.5rem 1.5rem 1.5rem 0.3rem',
        pill: '999px',
      },
      boxShadow: {
        glow: '0 0 40px -8px rgb(var(--color-coral) / 0.4)',
        glowPlum: '0 0 40px -8px rgb(var(--color-plum-fixed) / 0.35)',
      },
      backgroundImage: {
        'hero-gradient':
          'radial-gradient(circle at 20% 20%, rgb(var(--color-coral) / 0.16), transparent 45%), radial-gradient(circle at 80% 0%, rgb(var(--color-plum-fixed) / 0.14), transparent 42%)',
      },
      transitionProperty: {
        theme: 'background-color, border-color, color, box-shadow',
      },
    },
  },
  plugins: [],
}
