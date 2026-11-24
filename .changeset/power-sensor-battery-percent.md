---
'@viamrobotics/test-widgets': minor
---

Show the battery charge in `PowerSensorWidget`. A `GetBatteryPercent` section appears beside current, voltage, and power when the sensor's `GetProperties` reports `isBatteryPercentSupported`. A sensor without a battery, or a machine whose RDK has no `GetProperties`, looks as it did before.
