/// <reference types="vite-plugin-svgr/client" />
/// <reference types="unplugin-fonts/client" />
/// <reference types="vite/client" />

import unpluginFavicons from "@anolilab/unplugin-favicons/vite";
import netlify from "@netlify/vite-plugin-tanstack-start";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import errorOverlay from "@visulima/vite-overlay";
import react from "@vitejs/plugin-react";
import Unfonts from "unplugin-fonts/vite";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import viteTsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    build: {
        target: "esnext",
    },
    plugins: [
        errorOverlay(),
        viteTsConfigPaths(),
        unpluginFavicons({
            cache: true,
            inject: true,
            logo: "./src/assets/images/logo.svg",
        }),
        tailwindcss(),
        tanstackStart(),
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
        netlify(),
    ],
    server: {
        proxy: {
            "/pr/posthog": {
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/pr\/posthog/, ""),
                target: "https://eu.i.posthog.com",
            },
        },
    },
    ssr: {
        noExternal: ["@c15t/react"],
        // Optimize SSR performance
        optimizeDeps: {
            include: ["react", "react-dom"],
        },
    },
});
