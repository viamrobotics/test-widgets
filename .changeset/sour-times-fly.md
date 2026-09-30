---
'@viamrobotics/test-widgets': minor
---

ApiSection and MutationSection wrap their content in an error boundary, so a failing API section shows its error in place instead of taking down the whole resource widget. ConnectionStatus keeps an outer boundary as a last resort. The shared StopWidget renders its own Stop section and requires an api prop.
