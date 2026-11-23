---
'@viamrobotics/test-widgets': minor
---

Bump `@viamrobotics/sdk` to 0.79.1 and raise the peer range to `>=0.78.0`.

SDK 0.78 replaced the navigation service API. Waypoints, obstacles, and modes are gone, and saved locations, routes, zones, and goals take their place. The navigation widget keeps its layout and is ported as a stopgap until it is rebuilt in the next major version:

- A waypoint is now a saved location with a GPS position. A map click saves one, and the legend deletes one.
- The Waypoint mode starts a route through every saved location, and Manual cancels the current goal.
- Obstacles are not drawn. Zones replaced them, and the widget does not read zones yet.
- A navigation service on a local map shows no robot marker and no waypoints.

A machine on an RDK older than the navigation refactor no longer works with this widget.
