/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#202522",
        moss: "#25312c",
        sage: "#f6f7f4",
        teal: "#0f766e",
        coral: "#bd4b3f"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(32, 37, 34, 0.08)"
      },
      borderRadius: {
        app: "8px"
      }
    }
  },
  plugins: []
};

