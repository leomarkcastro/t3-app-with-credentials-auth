import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: "dark",
    prefix: "d-", // prefix for daisyUI classnames (components, modifiers and responsive class names. Not colors)
    themeRoot: ":root", // The element that receives theme color CSS variables
  },
} satisfies Config;
