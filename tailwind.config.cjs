/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#F15A22',
          ember: '#C4421A',
          green: '#16A34A',
          ink: '#1A1A2E',
          mist: '#F5F6FA',
          sand: '#FFF0EB'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      boxShadow: {
        soft: '0 12px 32px rgba(15, 23, 42, 0.08)',
        float: '0 18px 60px rgba(241, 90, 34, 0.18)'
      },
      borderRadius: {
        xl2: '1.25rem'
      },
      screens: {
        xs: '375px',
        sm: '480px'
      },
      backgroundImage: {
        'hero-radial': 'radial-gradient(circle at top right, rgba(255,255,255,0.24), transparent 35%), radial-gradient(circle at bottom left, rgba(255,255,255,0.12), transparent 30%)'
      }
    }
  },
  plugins: []
};
