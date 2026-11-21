---
'@viamrobotics/test-widgets': minor
---

`AudioOutputControls` Hold to talk streams the microphone through `PlayStream` while held, and sends what is still queued on release. Where the transport cannot stream a request, it records while held and sends the clip through `Play` on release, as before. The control's recommended widths are 320 and 672 px.
