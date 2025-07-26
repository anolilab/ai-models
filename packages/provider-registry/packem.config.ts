import type { BuildConfig } from "@visulima/packem/config";
import { defineConfig } from "@visulima/packem/config";
import transformer from "@visulima/packem/transformer/esbuild";

export default defineConfig({
    rollup: {
        license: {
            path: "./LICENSE.md",
        },
    },
    transformer,
}) as BuildConfig;
