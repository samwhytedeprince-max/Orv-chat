export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        gradient: {
          start: '#3b82f6',
          end: '#06b6d4',
        },
      },
      animation: {
        spin: 'spin 1s linear infinite',
      },
    },
  },
  plugins: [],
}
