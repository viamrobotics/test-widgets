---
'@viamrobotics/test-widgets': minor
---

The pose editor in the arm's MoveToPosition and motion's Move widgets stacks its X, Y, and Z fields one a row when their group is under 352 px wide. Orientation moves beside position from 720 px, up from 620 px, so each column still holds its three fields in one row.
