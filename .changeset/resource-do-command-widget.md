---
'@viamrobotics/test-widgets': patch
---

Add `ResourceDoCommandWidget`, a registry-conforming DoCommand widget that takes `{ partID, resourceName }` and resolves the full `ResourceName` internally, so it can be dropped into the resource widget registry alongside the other `ResourceWidget`s.
