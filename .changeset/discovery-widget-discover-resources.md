---
'@viamrobotics/test-widgets': major
---

`DiscoveryWidget` renders the `DiscoverResources` widget and no longer renders `DiscoveryControls`. Each result gets a copy button inside its JSON block for the whole config. `onAddComponent` and `componentPreview` stay on `DiscoveryWidget`, deprecated, and do nothing. Use `DiscoveryControls` for Add to config. `DiscoveryControls` drops its Copy all configs button and shows a field with two or three short values as toggle buttons.
