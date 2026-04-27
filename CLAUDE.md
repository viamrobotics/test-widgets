# test-widgets

A library of Svelte components for interacting with Viam-powered machines. Each widget provides a test interface for a specific resource type — arms, bases, cameras, motors, sensors, and more — allowing users to send commands, view live data, and control hardware directly from the browser.

## Tech stack

| Layer           | Technology          |
| --------------- | ------------------- |
| Frontend        | Svelte 5 (runes)    |
| Styling         | TailwindCSS         |
| Package manager | pnpm                |
| Testing         | Vitest + Playwright |

## Commands

```
pnpm dev           # start dev server
pnpm build         # build for production
pnpm check         # svelte-check
pnpm lint          # prettier + eslint
pnpm format        # prettier + eslint --fix
pnpm test          # vitest unit tests
pnpm test:e2e      # Playwright E2E
```

## Generated code — never hand-edit

- Any files included in `.gitignore` should not be edited

## Code organization

Organize code by feature with **one focused unit per file**. File names should describe what the code does. Avoid generic bucket files (`utils`, `helpers`, `constants`).

## Topic-specific rules

Detailed guidance lives in `.claude/rules/`. Path-scoped rules load when Claude reads matching files; rules without `paths` load every session.

| Rule                  | Loads when                                          |
| --------------------- | --------------------------------------------------- |
| `svelte.md`           | editing `.svelte`, `.svelte.ts`, `.svelte.js`       |
| `typescript.md`       | editing `.ts`                                       |
| `testing-frontend.md` | editing frontend test files (`src/**/*.spec.ts`)    |
| `pr-description.md`   | editing files under `.changeset/`                   |
| `changesets.md`       | editing files under `.changeset/` or `CHANGELOG.md` |

---

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
