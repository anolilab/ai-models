import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import Unfonts from "unplugin-fonts/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart({
      customViteReactPlugin: true,
    }),
    react({
        babel: {
            plugins: [["babel-plugin-react-compiler", { target: "19" }]],
        },
    }),
    Unfonts({
      google: {
        families: ["Inter:400,500,600,700"],
      },
    }),
  ],
});