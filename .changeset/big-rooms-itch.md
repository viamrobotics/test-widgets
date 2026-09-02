---
'@viamrobotics/test-widgets': minor
---

The arm MoveToPosition widget can now route moves through a motion service Move call for planned, obstacle-aware movement. When the machine has a motion service, motion mode is the default with an info banner, and direct arm control sits behind a toggle with a danger warning. With more than one motion service, a select chooses which service handles the move, defaulting to builtin. With no motion service the widget keeps the direct path and shows the danger banner.
