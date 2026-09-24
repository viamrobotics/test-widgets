---
'@viamrobotics/test-widgets': minor
---

Rework the arm widget into a layout of resource widgets. 

Manual mode is split into ArmGetManualModeWidget and ArmSetManualModeWidget, rendered as a band only when GetProperties reports manual mode support. The ArmManualModeWidget export is replaced by those two. 

Every arm API widget, including the new ArmStopWidget, renders its own ApiSection. 

ArmQuickMoveWidget is deprecated: it renders ArmMoveToJointPositionsWidget, whose jogging mode covers the same per-joint moves with joint limits and a jog queue, and it will be removed in a future major. The arm's quick-move registry entry is gone since it duplicated move-to-joint-positions. 

Requires @viamrobotics/sdk >=0.76.
