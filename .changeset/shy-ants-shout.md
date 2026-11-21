---
'@viamrobotics/test-widgets': minor
---

Add optional `maxRpm`, `minPowerPct`, and `maxPowerPct` props to `MotorControls` and `MotorQuickMoveControl`, and `maxRpm` to `MotorMoveControl`, for a host to fill from a gpio motor's `max_rpm`, `min_power_pct`, and `max_power_pct`. An RPM over `maxRpm` is flagged and not sent. The Power slider spans the given range. The power values are fractions from 0 to 1, as in the config. An invalid value is ignored.
