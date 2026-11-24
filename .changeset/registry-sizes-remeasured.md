---
'@viamrobotics/test-widgets': patch
---

Registry sizes are re-measured against prime-controls 0.6.0. Widgets with number fields are about 12 px wider at their minimum, for the step buttons. The gantry, gripper, and servo move widgets are shorter, since the reset row under their fields is gone. Base SetPower and SetVelocity and the pose editors are taller at their minimum, since their fields stack in a narrow box. A widget's `minHeight` is now read at its own `minWidth`, not at the width of a wider pane header.
