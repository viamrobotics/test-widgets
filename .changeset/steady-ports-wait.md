---
'@viamrobotics/test-widgets': minor
---

`ConnectionStatus` requires its `connected` snippet and drops the `status` prop, which only tests used. It renders a view for every machine connection status, with optional `dialing`, `reconnecting`, `reconnectionFailed` and `disconnecting` snippets beside `connecting` and `disconnected`. A view that crashed recovers when the status changes.
