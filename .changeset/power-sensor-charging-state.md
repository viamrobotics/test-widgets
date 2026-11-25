---
'@viamrobotics/test-widgets': minor
---

Show the charging state in the `PowerSensorWidget` battery section. It appears as `(charging)` or `(not charging)` after the percent when the sensor's `GetProperties` reports `isChargingSupported`. Raise the `@viamrobotics/sdk` peer range to `>=0.79.2`, where `getBatteryPercent` resolves to `[percent, isCharging]`.
