# test-widgets

A library of Svelte components for interacting with Viam-powered machines. Each widget provides a test interface for a specific resource type — arms, bases, cameras, motors, sensors, and more — allowing users to send commands, view live data, and control hardware directly from the browser.

## Tech stack

| Layer           | Technology                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| Frontend        | Svelte 5 (runes), Threlte/Three.js for 3D widgets                                                            |
| Styling         | TailwindCSS 4 with `@viamrobotics/tailwind-config`, `@viamrobotics/prime-controls`, `@viamrobotics/prime-ui` |
| Package manager | pnpm                                                                                                         |
| Testing         | Vitest (browser mode) + Playwright                                                                           |

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

- Gitignored files, including `.claude/scripts/` (houserules build output). If a hook reports a missing script, run `pnpm exec houserules update`.

## Code organization

Organize code by feature with **one focused unit per file**. File names should describe what the code does. Avoid generic bucket files (`utils`, `helpers`, `constants`).

## Topic-specific rules

Detailed guidance lives in `.claude/rules/`. Each rule's `paths:` frontmatter sets when it loads. Repo-owned rules: `testing-frontend.md`, `frontend-aesthetics.md`, `threlte-widgets.md`, `viam-context.md`. The rest are kit-managed by houserules.

<!-- houserules:claude-md start -->

@.claude/houserules.md

<!-- houserules:claude-md end -->
