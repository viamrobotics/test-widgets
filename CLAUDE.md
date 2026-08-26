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
| `viam-context.md`        | every session (no path scope)                  |

<!-- houserules:claude-md start -->

### houserules sections

This block is maintained by `npx houserules update`. Content outside the markers is yours
and never touched. Templates for a fuller CLAUDE.md skeleton and for guardrail rules live
in `.claude/templates/`.

### Skill triggers

- After a meaningful change to a package: record a changeset with `/changeset`, **before
  the commit**.
- Too big to hold in one plan: scaffold with `/plan-project`, then execute each phase with
  `/orchestrate`.

### Conventions

- **The user always handles `git commit` / `push` / PR-create.** Describe what is ready and stop.
  (Enforced by `.claude/scripts/guard-bash.mjs`.)
- **Edit from the file's current bytes.** Re-read before editing when your view of it is
  second-hand (an earlier snapshot, a build or lint error, another tool's output) or the user may
  have it open. A tool's report and the file on disk can disagree within seconds.
- **Do not rewrite what is not yours to change.** When the user presents a file as their own
  finished work, or has it open mid-edit, surface the problem and let them decide.

### Cost & verification discipline

- Stage-sized work (≤ a handful of files): implement directly in-context, with no implementation
  subagents. Reserve subagents for genuinely parallel or unbounded work (wide sweeps, migrations).
- Exception, a planned phase under `/orchestrate`: dispatch one scoped `task-worker` per slice
  and review the returned reports. Never pull a worker’s diff into the main context.
- Verify with static gates (tests, typecheck, lint) plus a short falsifiable acceptance checklist
  for the user. No browser/screenshot verification unless explicitly asked.
- Run those gates in order: format first, since it rewrites in place and settles the mechanical
  noise, then lint with autofix so only real problems are left, then typecheck and test. Scope
  each command to the packages you changed. This order is for work you do yourself.
  When subagents are editing in parallel, the fixer runs once after they report, never inside
  one of them, since it rewrites files their siblings still have open.
- **"Done" means every check passed, not that the edits were made.** Report a check that failed
  or never ran, with its output. Never claim success over one you did not see pass.
  The recorded evasions, and what each one actually means:
  | Excuse | Reality |
  | --- | --- |
  | "The edits are in, so it is done" | Done is the checks passing, with output you read. |
  | "I know this fact from memory" | State it only after running the command that could falsify it. |
  | "It passed earlier" | A stale or cached pass is not this change's pass. Re-run on current bytes. |
  | "The subagent reported success" | The tree is the evidence. Check it before believing the report. |
- Derive empirical constants by parsing the artifact itself, not screenshot-and-iterate loops.
- On AskUserQuestion timeout, stop and re-ask later. Never carry tentative selections forward.
- Read the repo's own docs + targeted greps before fanning out Explore/Plan agents.

### Tool-use efficiency

- `grep -n` to locate, then `Read` with `offset`/`limit`. Never read big files whole.
- Never `git stash` to baseline-check. Use `git diff --name-only` / `git show HEAD:<path>`.
- Pipe long command output through `grep`, and batch related greps into one call.

<!-- houserules:claude-md end -->
