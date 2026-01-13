import type { BuildConfig } from "@visulima/packem/config";
import { defineConfig } from "@visulima/packem/config";
import transformer from "@visulima/packem/transformer/esbuild";

export default defineConfig({
    runtime: "node",
    cjsInterop: false,
    rollup: {
        license: {
            path: "./LICENSE.md",
        },
    },
    transformer,
    validation: {
        packageJson: {
            exports: false,
        },
    },
}) as BuildConfig;
