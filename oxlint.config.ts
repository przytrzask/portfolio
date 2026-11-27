import foldkitRecommended from "@foldkit/oxlint-plugin/recommended.json" with { type: "json" };
import { defineConfig } from "oxlint";

const foldkitScope = (pattern: string) => `apps/site/src/${pattern}`;

const foldkitSeverity = ([rule, severity]: readonly [string, string]) => {
  if (severity === "error" || severity === "off") {
    return [rule, severity] as const;
  }

  throw new Error(
    `@foldkit/oxlint-plugin/recommended.json sets ${rule} to ${severity}. Map that severity in oxlint.config.ts before bumping the plugin.`
  );
};

const foldkitRules = (rules: Readonly<Record<string, string>>) =>
  Object.fromEntries(Object.entries(rules).map(foldkitSeverity));

const foldkitOverrides = [
  {
    files: [foldkitScope("**/*.ts")],
    rules: foldkitRules(foldkitRecommended.rules),
  },
  ...foldkitRecommended.overrides.map(({ excludeFiles, files, rules }) => ({
    excludeFiles: excludeFiles?.map(foldkitScope) ?? [],
    files: files.map(foldkitScope),
    rules: foldkitRules(rules),
  })),
];

export default defineConfig({
  categories: {
    correctness: "error",
    perf: "error",
    suspicious: "error",
  },
  env: {
    browser: true,
  },
  ignorePatterns: [
    "**/dist/**",
    "node_modules/**",
    ".pi/**",
    ".claude/**",
    "scripts/hooks/**",
    "tools/oxlint/anti-slop/**",
  ],
  jsPlugins: [
    { name: "foldkit", specifier: "@foldkit/oxlint-plugin" },
    "./scripts/oxlint-plugin-effect-tests.ts",
    "./scripts/oxlint-plugin-no-comments.ts",
    {
      name: "rat-stack-patterns",
      specifier: "./scripts/oxlint-plugin-patterns.ts",
    },
    { name: "anti-slop", specifier: "./tools/oxlint/anti-slop/index.ts" },
    {
      name: "anti-slop-effect",
      specifier: "./tools/oxlint/anti-slop/effect/index.ts",
    },
  ],
  options: {
    typeAware: true,
  },
  overrides: foldkitOverrides,
  plugins: ["eslint", "typescript", "unicorn", "oxc", "import", "promise"],
  rules: {
    "anti-slop-effect/no-manual-effect-error-tag": "error",
    "anti-slop-effect/no-manual-tag-comparison": "error",
    "anti-slop-effect/no-manual-tagged-construction": "error",
    "anti-slop-effect/no-service-constructor-imports": "error",
    "anti-slop-effect/prefer-effect-match": "error",
    "anti-slop/no-array-filter-map": "error",
    "anti-slop/no-chained-type-assertions": "error",
    "anti-slop/no-conditional-empty-object-spread": "error",
    "anti-slop/no-known-value-widening": "error",
    "anti-slop/no-module-mocking": "error",
    "anti-slop/no-object-parameters": "error",
    "anti-slop/no-reduce-accumulator-copy": "error",
    "anti-slop/no-reflect-apply": "error",
    "anti-slop/no-reflect-get": "error",
    "anti-slop/no-runtime-typeof": "error",
    "anti-slop/no-shape-in-symbol-names": "error",
    "anti-slop/no-unknown-parameters": "error",
    "anti-slop/no-unknown-returns": "error",
    "anti-slop/no-unknown-type-aliases": "error",
    "anti-slop/no-unsafe-dictionary-type": "error",
    "anti-slop/no-widen-then-assert": "error",
    "anti-slop/require-readable-spacing": "error",
    "anti-slop/require-safety-comment-for-type-assertion": "error",
    "effect-tests/no-manual-effect-runtime-in-tests": "error",
    "eslint/eqeqeq": "error",
    "eslint/no-console": "error",
    "eslint/no-var": "error",
    "eslint/prefer-const": "error",
    "import/no-cycle": "error",
    "import/no-unassigned-import": ["error", { allow: ["**/*.css"] }],
    "no-comments/directive-reason": "error",
    "no-comments/no-comments": "error",
    "oxc/no-accumulating-spread": "error",
    "rat-stack-patterns/acquire-release-constructs-in-acquire-body": "error",
    "rat-stack-patterns/no-module-level-mutable-state": "error",
    "rat-stack-patterns/no-shared-pending-cache": "error",
    "rat-stack-patterns/no-sleep-in-loop": "error",
    "rat-stack-patterns/retain-needs-stage-policy": "error",
    "rat-stack-patterns/shared-waiters": "error",
    "typescript/no-explicit-any": "error",
    "typescript/no-floating-promises": "error",
  },
});
