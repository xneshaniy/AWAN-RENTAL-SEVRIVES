import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          // Action green - the colour every button, link, badge and active
          // state uses. 600 is #15803d: white labels on it reach 5.02:1 and
          // text-primary-100 (#dcfce7) on it reaches 4.57:1, both clearing
          // the 4.5:1 WCAG AA minimum. Stock green-600 #16a34a only reaches
          // 3.29:1 against white, so it is parked at 500 where it is used
          // only for rings and borders (needs 3:1 for WCAG 1.4.11, gets
          // 3.30:1). 100 stays pale so text-primary-700 on it clears 4.5:1.
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#16a34a',
          600: '#15803d',
          700: '#166534',
          800: '#14532d',
          900: '#0a3d1f',
          950: '#052e16',
        },
        // Warm off-white section band - the cream the page bands use instead
        // of the cool #f9fafb grey. Held at #f7f6f2 rather than a deeper
        // cream so text-gray-500 (#6b7280) laid straight on it still measures
        // 4.53:1 and the axe colour-contrast gate stays green.
        cream: {
          50: '#faf9f6',
          100: '#f7f6f2',
          200: '#efece4',
          300: '#e3dfd5',
        },
        // WhatsApp green. Darkened one step from Tailwind's stock green so
        // white button labels clear the 4.5:1 contrast minimum (stock
        // green-600 #16a34a only reaches 3.29:1).
        green: {
          600: '#15803d',
          700: '#166534',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          50: '#fdf4ed',
          100: '#fae8dd',
          200: '#f6d6bc',
          300: '#f0b88a',
          400: '#e89156',
          500: '#e07431',
          600: '#b84418',
          700: '#943519',
          800: '#943519',
          900: '#792e17',
          950: '#41140b',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'system-ui', 'sans-serif'],
      },
      container: {
        center: true,
        padding: '1.5rem',
        screens: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1400px',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};

export default config;