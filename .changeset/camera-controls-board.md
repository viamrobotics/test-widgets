---
'@viamrobotics/test-widgets': minor
---

`CameraControls` matches its board. The heading reads "Controls". A failed poll or a dropped Live stream goes to the section's error indicator instead of over the feed, and a dropped stream brings back Start feed. Resolution is a plain row with Reset and Execute while Live. Both modes offer the Fit select, and Point cloud mode offers Keep ratio and Fit. The mouse position tooltip follows the fit. New optional props: `widthPx` and `heightPx`, from a webcam's `width_px` and `height_px`, set the feed's ratio before the first frame, and `defaultFit` seeds the fit. `LiveOrPollingVideo` takes optional `onPollingError` and `onStreamError` callbacks that replace its error overlay.
