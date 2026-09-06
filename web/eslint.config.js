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
            // shadcn/ui components are generated and overwritten by the shadcn CLI
            // (see components.json), so they are not ours to hand-edit.
            "src/components/ui",
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
        // Test and test-support files: logging is how a dummy server reports what it did,
        // and a regex inside an assertion is clearer next to the assertion than hoisted
        // to module scope.
        files: ["__tests__/**", "**/*.spec.ts", "**/*.test.ts", "**/*.test.tsx"],
        rules: {
            "e18e/prefer-static-regex": "off",
            "no-console": "off",
        },
    },
    {
        // Playwright specs, not Testing Library ones. `page.getByRole(...)` is Playwright's
        // locator API; the testing-library plugin sees the query names and suggests
        // `screen.getByRole`, which does not exist here and would break the test.
        files: ["**/*.e2e.spec.ts"],
        rules: {
            "testing-library/prefer-screen-queries": "off",
        },
    },
    {
        files: ["src/models-data.ts"],
        rules: {
            "no-secrets/no-secrets": "off",
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
