---
'@viamrobotics/test-widgets': minor
---

`VisionServiceControls` preselects the service's default camera from `GetProperties`, then the machine's first camera. New optional `minimumConfidence` and `labelConfidences` props, from an mlmodel service's `default_minimum_confidence` and `label_confidences`, show a line such as "Showing 0.5 and above". The control filters nothing, because the service applies them.
