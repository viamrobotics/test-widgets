---
'@viamrobotics/test-widgets': minor
---

Add `MotorControls`, the motor control interface, and `MotorMoveControl`, registered as motor's `controls` and `move` entries with `kind: 'control'`. `MotorControls` shows Moving, Stop, Power, and Position, then composes the Quick move and Move controls. Move sends `GoFor` in Relative mode and `GoTo` in Absolute mode, and offers Reset zero.

Behavior change to the existing `quick-move` entry (`MotorQuickMoveControl`): on a motor that reports its position, a held Forward or Backward now runs at an RPM with `SetRPM`, with an RPM field in place of Power. A motor that reports no position keeps the `SetPower` hold. Release now sends `Stop` in both modes, not `SetPower(0)`.
