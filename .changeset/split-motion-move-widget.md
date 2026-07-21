---
'@viamrobotics/test-widgets': minor
---

Split the motion widget into `MotionServiceWidget`, which owns the component and destination-frame selects, and a controlled `MotionMoveWidget` that takes `frameName` and `destination` props and renders just the Move controls, so the controls can be embedded alongside an external frame selection. Renames the move target from `componentName` to `frameName`, since targets are frame-system frames (e.g. individual arm links), not only components.
