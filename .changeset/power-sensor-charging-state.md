---
'@viamrobotics/test-widgets': minor
---

Show the charging state in the `PowerSensorWidget` battery section. It appears as `(charging)` or `(not charging)` after the percent when the sensor's `GetProperties` reports `isChargingSupported`. Requires an `@viamrobotics/sdk` release where `getBatteryPercent` resolves to `[percent, isCharging]`.
