---
'@viamrobotics/test-widgets': minor
---

Add optional `axisNames` and `defaultSpeedsMmPerSec` props to `GantryControls` and `GantryQuickMoveControl`. `axisNames` comes from a multi-axis gantry's `subaxes_list` and replaces "Axis 0" in the rows and the status line. A list whose length differs from `GetLengths` is ignored. `defaultSpeedsMmPerSec` holds each axis's `gantry_mm_per_sec`, and the Speed field starts at its smallest valid entry in place of 50 mm/s.
