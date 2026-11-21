---
'@viamrobotics/test-widgets': minor
---

Add a Fit select to the media frame: Keep ratio, Fit, Stretch, and Crop to fill. It is opt-in through `createMediaFit`, which saves the person's pick per resource and takes a host default that only seeds it. A canvas or map offers Keep ratio and Fit only. `PCDWidget` takes optional `fit` and `startAutomatically` props for its frame. The frame's fps chip is the neutral badge, and Screenshot shows busy while it saves and ignores a press until it settles.
