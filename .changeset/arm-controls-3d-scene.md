---
'@viamrobotics/test-widgets': minor
---

Add the arm 3D scene to `ArmControls`, from a new `@viamrobotics/test-widgets/arm-scene` entry that exports `ArmScene`. A host passes `ArmScene` to `provideArmScene`. The main entry never imports the scene, so a host that does not supply it does not need `@viamrobotics/visualization`.

- From a 672 px container, the scene renders inline under the status row. Below that, "Open 3D scene" in the heading opens it in a pop-out at least 672 by 504 px.
- The scene focuses the arm and dims other geometry. On the builtin motion service it adds a target gizmo and a Plan preview panel. "Preview move" plans the staged goal and draws the path, and "Execute plan" runs that exact plan.
- An error thrown by a per-frame task is reported to the pane's error indicator, and the scene keeps rendering.
- Without `provideArmScene`, `ArmControls` renders as before.
