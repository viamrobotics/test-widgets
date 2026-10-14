---
'@viamrobotics/test-widgets': minor
---

Add `CustomControlWidget`, which renders a prebuilt control artifact in a sandboxed iframe (`allow-scripts` only) and hosts it on the part's `RobotClient` through `@viamrobotics/post-message-sdk`, scoped to its own resource. The widget injects a Content Security Policy into every artifact so a control can reach nothing but the bridge, sizes the frame from the guest's reports within `min-h-px max-h-[80vh]`, and contains a failing control in a `<svelte:boundary>` whose `error` snippet receives `{ failure, reset }`. Add `loadCustomControl`, which fetches a resource's artifact over `doCommand({ command: 'get-custom-control' })`, and `prepareArtifact` plus `CUSTOM_CONTROL_CSP`.
