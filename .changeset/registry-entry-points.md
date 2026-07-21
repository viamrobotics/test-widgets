---
'@viamrobotics/test-widgets': minor
---

Move the registry lookups (`apiWidgetsForResource`, `widgetForResource`, `availableAPIWidgets`) to a new `/registry` entry point so the package root stays tree-shakeable, and declare `maplibre-gl` and `@viamrobotics/three` as optional peer dependencies.
