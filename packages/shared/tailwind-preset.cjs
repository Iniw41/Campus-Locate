// Design tokens shared by both frontends (colors/fonts taken from the WITS portal look).
module.exports = {
  theme: {
    extend: {
      colors: {
        maroon: { DEFAULT: '#8B353D', dark: '#6E2A31', light: '#F6E9EA' },
        // gold keeps its original DEFAULT; light/soft are just tints of the same hue
        gold: { DEFAULT: '#A8891A', light: '#F2E6B8', soft: '#FBF6E2' },
        surface: '#EFF0F2',
        field: '#E8EEFB',
      },
      fontFamily: {
        sans: ['"Exo 2"', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', '"Exo 2"', 'system-ui', 'sans-serif'],
      },
    },
  },
};
