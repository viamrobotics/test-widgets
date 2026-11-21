---
'@viamrobotics/test-widgets': minor
---

Add optional `minDegrees` and `maxDegrees` props to `ServoControls`, `ServoMoveToControl`, and `ServoQuickMoveControl`, for a host to fill from the servo config's `min_angle_deg` and `max_angle_deg`. The slider and the steps stay inside the given range. A given maximum removes the manual Max field. With a minimum above 0, "Move to 0°" reads "Move to {min}°" and moves there. A value outside 0 to 360, or a minimum not below the maximum, is ignored.
