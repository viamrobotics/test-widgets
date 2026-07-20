---
'@viamrobotics/test-widgets': minor
---

Split the resource-widget registry into component and service halves, each exposed behind its own entry point for dynamic, registry-driven consumers. The composed lookups `apiWidgetsForResource`, `widgetForResource`, and `availableAPIWidgets` move out of the root and are now exported from the new `/registry` entry point. This keeps the root tree-shakeable: importing a widget or helper no longer pulls every widget (and the `maplibre-gl` / `@viamrobotics/three` peers the service widgets need) into the build. Update root imports of those three lookups to `@viamrobotics/test-widgets/registry`.