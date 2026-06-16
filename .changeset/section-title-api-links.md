---
'@viamrobotics/test-widgets': minor
---

Render resource API-method headers (GetPosition, MoveToPosition, etc.) as monospace links to the docs API reference. Adds a shared `SectionTitle` component and an `apiDocsHref(api, method)` helper, both exported from the package, and threads optional `method`/`href` props through `ApiSection`/`MutationSection` so existing callers are unaffected.
