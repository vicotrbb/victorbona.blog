module.exports = {
  theme: {
    extend: {
      keyframes: {
        "fade-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px) translateX(-50%)",
          },
          "100%": { opacity: "1", transform: "translateY(0) translateX(-50%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out forwards",
      },
    },
  },
};
