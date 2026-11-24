---
'@viamrobotics/test-widgets': minor
---

Add `providePopOutHost`, so a host app can open a control's pop-out content in a window it owns, such as a floating pane. `open({ title, minSize, content, onClose })` returns a function that closes the window. Without a host, a control falls back to a full-viewport prime-ui Takeover. Registry entries that pop out carry the window body's minimum as `popOutSize`, so a host can size the window before it mounts. Arm `controls` is the first.
