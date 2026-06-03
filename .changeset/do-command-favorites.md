---
'@viamrobotics/test-widgets': minor
---

Add an optional `header` snippet prop to `DoCommandWidget`, rendered above the input/output editor row. It receives `{ input, setInput }` so callers can read the current editor input and replace it (useful for "save as favorite" / "apply favorite" flows). 
