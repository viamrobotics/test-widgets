---
'@viamrobotics/test-widgets': minor
---

The reset to the current value moves inside each field, in the arm's MoveToPosition and MoveToJointPositions, motion's Move, servo's Move, gripper's GoToInputs, and gantry's MoveToPosition widgets.

- The row of current-value buttons under the fields is gone. An unedited field already shows the current value.
- Once a field is edited, a reset icon appears at the right of its frame, before the stepper. Its tooltip reads "Reset to" and the current value, and its accessible name reads "Reset X to 64.01 mm". It replaces "Reset X to its current value, 64.01".
- The icon keeps its space while hidden, so a field never changes width when it appears.

Requires `@viamrobotics/prime-controls` 0.6.0 or later, for the fields' `trailing` content.
