// tailwind.config.ts
import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 디자인 토큰: 테마별 색상 시스템
        app: {
          bg: "var(--color-app-bg)",
          text: "var(--color-text)",
          subtext: "var(--color-subtext)",
          border: "var(--color-border)",
          input: "var(--color-input-bg)",
          hover: "var(--color-hover-bg)",
        },
        top: {
          bg: "var(--color-top-bg)",
        },
        side: {
          bg: "var(--color-side-bg)",
          active: {
            bg: "var(--color-side-active-bg)",
            fg: "var(--color-side-active-fg)",
          },
        },
        main: {
          bg: "var(--color-main-bg)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
          foreground: "var(--color-accent-foreground)",
          soft: "var(--color-accent-soft)",
          ring: "var(--color-accent-ring)",
        },
        link: {
          DEFAULT: "var(--color-link)",
          hover: "var(--color-link-hover)",
          visited: "var(--color-link-visited)",
        },
      },
      borderRadius: {
        'card': '0.75rem', // 12px
        'input': '0.5rem',  // 8px
      },
      spacing: {
        'card': '1.5rem',   // 24px
        'input': '0.625rem', // 10px
      },
      fontSize: {
        'pt-10': '10pt',
        'pt-11': '11pt',
        'pt-12': '12pt',
        'pt-13': '13pt',
        'pt-14': '14pt',
        'pt-16': '16pt',
        'pt-18': '18pt',
        'pt-20': '20pt',
        'pt-24': '24pt',
        'pt-28': '28pt',
        'pt-32': '32pt',
      },
      lineHeight: {
        'tight': '1.2',
        'relaxed': '1.6',
      },
      letterSpacing: {
        'wide': '0.02em',
      },
    },
  },
  plugins: [animate],
} satisfies Config;
