# Portfolio

A portfolio site and the master record behind the resume, LinkedIn and GitHub. The site is prerendered to static HTML. It sits on the Rat Stack floor: strict types, type-aware lint, a format check, tests, and a commit hook that runs all of them.

## Stack

- `apps/site` (`@portfolio/site`): Foldkit 0.171 on Vite 8, with Tailwind 4. `vite build` prerenders every path in `src/entry.server.ts`'s `prerenderPaths` to `dist/client/*.html`, and `Runtime.hydrate` takes over in the browser.
- `apps/infra` (`@portfolio/infra`): the Alchemy 2 beta Stack `Portfolio` (`alchemy.run.ts`). It deploys `apps/site/src/website.ts` (`Cloudflare.Website.Foldkit` on `workers.dev`) and keeps state in the `alchemy-state-store-portfolio` Worker. Stage `prod` uses the fixed Worker name `portfolio` (https://portfolio.przytrzask.workers.dev). On a pull request it would post the preview URL as a comment. `stacks/github.ts` is the one-time credentials stack (not run yet): it mints the CI token and writes the `CLOUDFLARE_*` GitHub secrets.
- `.github/workflows/ci.yml` runs the checks on every push and PR. Deploy-on-merge (`deploy.yml`) is deferred until the CI secrets exist; see git history for the workflow.
- Effect 4.1, TypeScript 7, checked by `effect-tsrs` with the Effect diagnostics in `tsconfig.base.json` set as errors.
- pnpm 11.3.0, Node 24.18.0 (`.nvmrc`), Turbo.

## Content

The repo root holds the job kit's portfolio layout, and the site reads it at build time:

- `portfolio.json`: the master record (the kit schema plus `artifacts[].proof` for the home page's proof cards). `apps/site/src/content/portfolio.ts` decodes it, and the build fails if it doesn't match.
- `case-studies/<slug>.md`: one per artifact, with the kit's sections as headings (Context, My role and constraints, Key decisions, What went wrong, Result, The evidence). Each becomes `/work/<slug>`, and its artifact's `case_study` must point at it.
- `brag/entries/YYYY-MM-DD.md`: curated wins for `/shipped`. Entries without `status: curated` are skipped. An optional `- Date: YYYY-MM-DD` bullet per item gives its own date (it must fall inside the entry's period); without it the item shows the period, like "21–27 Nov 2026". The kit's `resume_rebuild.py` ignores the bullet.
- `public/resume.pdf`: served at `/resume.pdf`.
- Mermaid diagrams stay in the case-study Markdown (` ```mermaid `). At build time `src/build/diagrams-plugin.ts` renders each one to inline SVG with `beautiful-mermaid` (pure TypeScript, no browser; `src/diagrams/render.ts`), so no Mermaid code reaches the browser. Give every diagram an `accTitle:` (its visible caption and SVG `<title>`) and an `accDescr:` (SVG `<desc>`). A diagram that fails to render prints a build warning, and the page shows its source as a code block.

NDA: no client or employer-internal names, people, ticket IDs or internal URLs. Write `[ask: …]` for any fact you don't have; never invent one. Links whose value is still `[ask: …]` aren't rendered.

## Metadata and agent-readable files

- `src/meta.ts` holds each page's title, description, canonical path and the JSON-LD `Person`. `src/document.ts` writes them into the head with the Open Graph tags, the favicon links and the font preload. Values still marked `[ask: …]` never reach metadata: the name falls back to the GitHub handle.
- `src/static-files.ts` builds `robots.txt`, `sitemap.xml` (every prerendered path), `llms.txt`, `shipped.md`, and a copy of each `case-studies/<slug>.md` at `/work/<slug>.md`, byte for byte. `src/build/emit-static-plugin.ts` writes them, plus `404.html`, into `dist/client` from a Vite `buildApp` hook, so the files exist whether `pnpm build` or Alchemy runs Vite.
- Unknown paths answer 404: `renderPage` in `src/entry.server.ts` sets the status from `prerenderPaths`. On Cloudflare, assets serve the prerendered pages, and every miss reaches that handler.
- `public/og.png` (1200×630) is a committed screenshot of `apps/site/og/og-card.html`, which loads the self-hosted font files. Regenerate it after changing the headline or proof cards: `"<Chrome or Chromium>" --headless --hide-scrollbars --force-device-scale-factor=1 --window-size=1200,630 --screenshot=public/og.png "file://$PWD/apps/site/og/og-card.html"`. `public/favicon.svg` is a black-diamond trail marker; `public/favicon.ico` is the same mark as a 32 px PNG in an ICO wrapper.

## Look

- The piste look: tokens in `apps/site/src/styles.css` (`@theme`), every class string in `apps/site/src/styles.ts`, case-study Markdown styled through `src/markdown-views.ts`. Below 760 px (`md`) the page is one column.
- Fonts are self-hosted from `@fontsource-variable/tasa-orbiter` and `@fontsource-variable/geist-mono` (OFL-1.1); `src/document.ts` preloads the Latin TASA Orbiter file. No third-party URL may appear in the build.
- Icons are SVG path data in `src/icons.ts`, copied from simple-icons (CC0-1.0; LinkedIn from 13.0.0, the last release that had it) and lucide-static (ISC, © Lucide Icons and Contributors). Every icon is `aria-hidden` beside visible link text.

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
