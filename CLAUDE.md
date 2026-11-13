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

### houserules sections

Maintained by `npx houserules update`. Text outside the markers is yours and never touched.
Fuller templates live in `.claude/templates/`.

### Skill triggers

- After a meaningful change to a package: record a changeset with `/changeset`, **before
  the commit**.
- Too big to hold in one plan: scaffold with `/plan-project`, then execute each phase with
  `/orchestrate`.

### Conventions

- **The user always handles `git commit` / `push` / PR-create.** Describe what is ready and stop.
- **Edit from the file's current bytes.** Re-read before editing when your view of it is
  second-hand (a snapshot, a lint error, another tool's output) or the user may have it open.
- **Do not rewrite what is not yours to change.** When the user presents a file as their own
  finished work, or has it open mid-edit, surface the problem and let them decide.
- **Watch for the missing `[houserules]` SessionStart banner.** Without it, the session started
  below the repo root and the installed hooks, including the Bash guard, are not active. Tell
  the user to relaunch Claude Code from the repo root.

### Cost & verification discipline

- Implement stage-sized work (a handful of files) in-context, with no implementation subagents.
  Reserve subagents for parallel or unbounded work (wide sweeps, migrations).
- Exception, a planned phase under `/orchestrate`: dispatch as that skill says. Never pull a
  worker’s diff into the main context.
- Verify with static gates (tests, typecheck, lint) plus a short falsifiable acceptance checklist
  for the user. No browser/screenshot verification unless explicitly asked.
- Run them in order, scoped to the packages you changed: format first, then lint with autofix,
  then typecheck and test, so only real problems are left.
- **"Done" means every check passed, not that the edits were made.** Report a check that failed
  or never ran, with its output. The recorded evasions, and what each one means:
  - "The edits are in, so it is done": done is the checks passing, with output you read.
  - "I know this fact from memory": state it only after running the command that could falsify it.
  - "It passed earlier": a stale or cached pass is not this change's pass. Re-run on current bytes.
  - "The subagent reported success": the tree is the evidence, not the report.
- When the user is blocked on each turn, a cheap reversible action is itself the check. Run it
  and let its result falsify, with at most one cheaper check first.
- Derive empirical constants by parsing the artifact itself, not screenshot-and-iterate loops.
- A subagent runs a command expected to outlast the default Bash timeout with
  `run_in_background: true`, ends its turn without reporting, and reports when the completion
  notification re-invokes it, reading the output file it names. A foreground call blocks the
  subagent until Claude Code moves it to the background anyway, so starting it there saves the
  blocked minutes and lets the subagent end its turn.
- On AskUserQuestion timeout, stop and re-ask later. Never carry tentative selections forward.
- Read the repo's own docs + targeted greps before fanning out Explore/Plan agents.

### Tool-use efficiency

- `grep -n` to locate, then `Read` with `offset`/`limit`. Grep output is location data, not
  content: never judge text against a grep listing of it.
- Pipe long command output through `grep`, and batch related greps into one call.

<!-- houserules:claude-md end -->
