# test-widgets

A library of Svelte components for interacting with Viam-powered machines. Each widget provides a test interface for a specific resource type — arms, bases, cameras, motors, sensors, and more — allowing users to send commands, view live data, and control hardware directly from the browser.

## Tech stack

| Layer           | Technology                                                           |
| --------------- | -------------------------------------------------------------------- |
| Frontend        | Svelte 5 (runes), Threlte/Three.js for 3D widgets                    |
| Styling         | TailwindCSS 4 with `@viamrobotics/tailwind-config`, PRIME components |
| Package manager | pnpm                                                                 |
| Testing         | Vitest (browser mode) + Playwright                                   |

## Commands

```
pnpm dev                      # start dev server
pnpm build                    # vite build + svelte-package
pnpm check                    # svelte-check --fail-on-warnings
pnpm lint                     # eslint (check only)
pnpm format                   # prettier --check
pnpm lint:fix                 # eslint --fix
pnpm format:fix               # prettier --write
pnpm test                     # vitest --run (browser mode)
pnpm test:e2e                 # Playwright (configured, no specs yet)
pnpm exec houserules doctor   # validate the kit-managed .claude/ install
pnpm exec houserules update   # refresh kit files after a @houserules/* bump
```

## Generated code — never hand-edit

- Any files included in `.gitignore` should not be edited
- `.claude/scripts/` is build output written by houserules and gitignored. If a hook reports a missing script, run `pnpm exec houserules update`.

## Code organization

Organize code by feature with **one focused unit per file**. File names should describe what the code does. Avoid generic bucket files (`utils`, `helpers`, `constants`).

## Topic-specific rules

Detailed guidance lives in `.claude/rules/`. Path-scoped rules load when Claude reads matching files; rules without `paths` load every session. Kit-managed rules (svelte, typescript, three, testing, design, accessibility, code-comments, prose-voice, code-cleanliness) are installed and documented by houserules, see the houserules block below. The repo-owned rules:

| Rule                     | Loads when                                     |
| ------------------------ | ---------------------------------------------- |
| `testing-frontend.md`    | editing `src/**/*.spec.ts` or `vite.config.ts` |
| `frontend-aesthetics.md` | editing `.svelte` or `.css`                    |
| `threlte-widgets.md`     | editing `.svelte` or `.svelte.ts` under `src/` |
| `viam-context.md`        | editing anything under `src/`                  |

<!-- houserules:claude-md start -->

@.claude/houserules.md

<!-- houserules:claude-md end -->
