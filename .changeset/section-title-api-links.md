---
'@viamrobotics/test-widgets': minor
---

Render resource API-method headers (GetPosition, MoveToPosition, etc.) as monospace links to the docs API reference. Adds a shared `SectionTitle` component and an `apiDocsHref(api, method)` helper, both exported from the package. `ApiSection`/`MutationSection` take an optional `api` prop (e.g. `"rdk:component:camera"`); the method name is derived from the title and the docs URL is built internally, so callers only pass `api`.
