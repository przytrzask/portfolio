# Portfolio

A portfolio site and the master record behind the resume, LinkedIn and GitHub. The site is prerendered to static HTML. It sits on the Rat Stack floor: strict types, type-aware lint, a format check, tests, and a commit hook that runs all of them.

## Stack

- `apps/site` (`@portfolio/site`): Foldkit 0.171 on Vite 8, with Tailwind 4. `vite build` prerenders every path in `src/entry.server.ts`'s `prerenderPaths` to `dist/client/*.html`, and `Runtime.hydrate` takes over in the browser.
- `apps/infra` (`@portfolio/infra`): the Alchemy 2 beta Stack `Portfolio` (`alchemy.run.ts`). It deploys `apps/site/src/website.ts` (`Cloudflare.Website.Foldkit` on `workers.dev`) and keeps state in the `alchemy-state-store-portfolio` Worker. Stage `prod` uses the fixed Worker name `portfolio` (https://portfolio.przytrzask.workers.dev). On a pull request it would post the preview URL as a comment. `stacks/github.ts` is the one-time credentials stack (not run yet): it mints the CI token and writes the `CLOUDFLARE_*` GitHub secrets.
- `.github/workflows/ci.yml` runs the checks on every push and PR. Deploy-on-merge (`deploy.yml`) is deferred until the CI secrets exist; see git history for the workflow.
- Effect 4.1, TypeScript 7, checked by `effect-tsrs` with the Effect diagnostics in `tsconfig.base.json` set as errors.
- pnpm 11.3.0, Node 24.18.0 (`.nvmrc`), Turbo.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm check` | Lockfile, types, `oxlint`, `oxfmt --check` |
| `pnpm test` | Vitest, including Foldkit scene tests (builds first) |
| `pnpm build` | `vite build` with prerendering |
| `pnpm fix` | `oxlint --fix` and `oxfmt` |
| `pnpm dev` | The Vite dev server for the site |
| `pnpm --filter @portfolio/infra plan --stage <stage>` | Alchemy plan; read-only once the state store exists |

## Rules

- Every commit passes `pnpm check` then `pnpm test` (lefthook). Never pass `--no-verify`: `scripts/vcs-command-policy.js` blocks it for Pi (`.pi/extensions/git-interceptor/`) and Claude Code (`.claude/settings.json`). If the hook fails, fix the failure. Ask the owner before you change `lefthook.yml`.
- No comments in code. Lint directives need a reason.
- Every page's content is in the raw HTML. Browser-only facts load after hydration, never during prerender.
- Views are pure. Imperative DOM work goes in a Foldkit `Mount`, a Subscription or a custom element.
- For now `prod` is deployed by the owner from `main`: `pnpm --filter @portfolio/infra exec alchemy deploy --stage prod`. Agents never deploy or destroy without the owner's go-ahead.
- Test views with Foldkit scene tests (`apps/site/test/*.scene.test.ts`). Prefer property tests for pure logic.
