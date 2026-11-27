import { defineConfig } from "oxfmt";

export default defineConfig({
  arrowParens: "always",
  bracketSameLine: false,
  bracketSpacing: true,
  endOfLine: "lf",
  ignorePatterns: [
    "**/dist/**",
    "**/node_modules/**",
    "pnpm-lock.yaml",
    "tools/oxlint/anti-slop/**",
  ],
  printWidth: 80,
  proseWrap: "never",
  quoteProps: "as-needed",
  semi: true,
  singleQuote: false,
  sortImports: {
    ignoreCase: true,
    newlinesBetween: true,
    order: "asc",
  },
  sortPackageJson: true,
  sortTailwindcss: {},
  tabWidth: 2,
  trailingComma: "es5",
  useTabs: false,
});
