import type { BuildConfig } from "@visulima/packem/config";
import { defineConfig } from "@visulima/packem/config";
import transformer from "@visulima/packem/transformer/esbuild";

export default defineConfig({
    runtime: "node",
    cjsInterop: false,
    rollup: {
        // Generate .d.ts via oxc isolated-declarations (per-file, no cross-entry
        // TypeScript program) instead of the type-checking tsc path. This sidesteps
        // the rollup-plugin-dts OOM that roots one TS program at all ~70 entries.
        dts: {
            oxc: true,
        },
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
