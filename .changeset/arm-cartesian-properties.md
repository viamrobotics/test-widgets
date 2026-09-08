---
'@viamrobotics/test-widgets': minor
---

The arm MoveToPosition control now uses the arm's `GetProperties` to lock the control-mode toggle to the motion service when the arm reports it cannot take direct cartesian commands.
