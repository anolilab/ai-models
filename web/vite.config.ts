import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import Unfonts from "unplugin-fonts/vite";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    plugins: [
        tsconfigPaths(),
        tailwindcss(),
        tanstackStart({
            customViteReactPlugin: true,
            target: "netlify",
        }),
        react({
            babel: {
                plugins: [["babel-plugin-react-compiler", { target: "19" }]],
            },
        }),
        Unfonts({
            fontsource: {
                families: [
                    {
                        name: "Inter",
                        weights: [300, 400, 500, 600, 700, 800],
                    },
                    {
                        name: "JetBrains Mono",
                        weights: [400, 500, 600],
                    },
                ],
            },
        }),
        svgr({
            // Optimize SVG imports
            svgrOptions: {
                // plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx"],
                svgoConfig: {
                    floatPrecision: 2,
                },
            },
        }),
    ],
});
