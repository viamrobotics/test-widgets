---
'@viamrobotics/test-widgets': patch
---

`CustomControlWidget` now names its resource in the bridge handshake, so a control's default `createResourceClient()` targets the resource the card was rendered for instead of staying disconnected.
