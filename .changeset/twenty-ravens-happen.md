---
'@viamrobotics/test-widgets': minor
---

The arm `MoveToPosition` card and the motion `Move` widget edit their target pose in a compact editor instead of a seven-row table. Position and orientation each take one row of drag-to-scrub fields, and each field shows its current value as a button that restores it. Orientation can be edited as an orientation vector or as Euler angles, in degrees or radians, chosen from a menu on the Orientation label, or by dragging an optional rotation gizmo. A non-unit orientation vector is normalized when you execute. The arm card moves Stop and IsMoving into a band at the top, so MoveToPosition gets a full-width row.
