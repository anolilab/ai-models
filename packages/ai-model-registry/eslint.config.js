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
    {
        rules: {
            // Prettier is the formatter of record for this package, and these two rules
            // demand the opposite of what it emits: prettier writes `(await x) ?? y` and
            // `[...(await x)]`, and puts `=` at the end of the line above a wrapped union
            // type. Enforcing them would make `lint:eslint` and `lint:prettier` unfixable
            // at the same time.
            "@stylistic/no-extra-parens": "off",
            "@stylistic/operator-linebreak": "off",
        },
    },
);
