import { createConfig } from "@anolilab/eslint-config";

/** @type {import("@anolilab/eslint-config").PromiseFlatConfigComposer} */
export default createConfig(
    {
        css: false,
        ignores: [
            "dist",
            "node_modules",
            "coverage",
            "__fixtures__",
            "__docs__",
            "examples",
            "vitest.config.ts",
            "packem.config.ts",
            ".secretlintrc.cjs",
            "tsconfig.eslint.json",
            "README.md",
            "data",
            "assets",
            "src/icons-sprite.ts",
            "scripts",
            "public",
            ".prettierrc.cjs",
            "MIGRATION.md",
        ],
        jsx: false,
        react: false,
        unicorn: false,
        // Enable this after the lint errors are fixed.
        // typescript: {
        //    tsconfigPath: "tsconfig.json",
        // },
    },
    {
        files: ["**/__tests__"],
        rules: {
            "unicorn/prefer-module": "off",
        },
    },
    {
        files: ["src/providers/*.ts", "src/types/*.ts"],
        rules: {
            "no-secrets/no-secrets": "off",
            "sonarjs/cognitive-complexity": "off",
        },
    },
    {
        files: ["scripts/**/*.ts"],
        rules: {
            "import/no-extraneous-dependencies": "off",
            "no-console": "off",
        },
    },
);
