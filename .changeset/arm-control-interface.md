---
'@viamrobotics/test-widgets': minor
---

Add `ArmControls`, the arm control interface, with `ArmJogControl` and `ArmJointsControl`. They are registered as arm's `controls`, `jog`, and `joints` entries with `kind: 'control'`.

- `ArmControls` shows Moving, Manual mode, Stop, and the avoidance line. It then composes Jog, Joints, one Steps folder, and the existing Manual mode control.
- Jog moves the end effector along X, Y, and Z, and rotates it by Roll, Pitch, and Yaw. It works in the World or End effector frame.
- Joints steps each joint inside its limits and shows the joint's current angle. It also runs Zero and a saved Home while held. "Set current as home" saves Home in the browser for each machine and arm.
- Every move goes through the motion service, so configured obstacles are avoided. On the builtin service, a held step moves in short planned segments. On any other motion service, it repeats single steps. Releasing a hold stops the arm. Joints needs the builtin service.

`ArmManualModeControl` gains an `isEmbedded` prop. Without it, the control renders as before.
