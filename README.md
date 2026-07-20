# @viamrobotics/test-widgets

A library of Svelte components for interacting with Viam-powered machines. Each widget provides a test interface for a specific resource type -- arms, bases, cameras, motors, sensors, and more -- allowing users to send commands, view live data, and control hardware directly from the browser.

Also includes reusable building blocks for visualizations, such as maps (MapLibre), SLAM mapping, 3D point clouds (Three.js), etc.

## Entry points

There is one root entry plus three registry entry points. Which you reach for depends on whether you name widgets **statically** or resolve them **dynamically** at runtime.

### Static use

Import the widget components you need and render them:

```ts
import { ArmWidget, CameraWidget } from '@viamrobotics/test-widgets'
```

### Dynamic use

If you resolve widgets at runtime from a resource (for example, a control panel that lists every API of every resource on a scanned machine), import the registry scoped to the kind of resource you actually render. Each exposes its registry object plus its query APIs:

- **`@viamrobotics/test-widgets/registry`** — the composed lookups `apiWidgetsForResource(resource)`, `widgetForResource(resource)`, and `availableAPIWidgets()`, which resolve any resource, component or service. Because it references both registries, importing it pulls **all** widgets and their optional peers into your build; reach for it only when you render both kinds of resource.
- **`@viamrobotics/test-widgets/component-registry`** — `componentWidgetRegistry`, `componentApiWidgets(resource)`, `componentWidgetForResource(resource)` for `rdk:component:*` resources.
- **`@viamrobotics/test-widgets/service-registry`** — `serviceWidgetRegistry`, `serviceApiWidgets(resource)`, `serviceWidgetForResource(resource)` for `rdk:service:*` resources (navigation, slam, vision, …).

```ts
import {
	componentApiWidgets,
	componentWidgetForResource,
} from '@viamrobotics/test-widgets/component-registry'
```

The point of the scoped registries is isolation: the two never reference each other, so a component-only consumer that imports `/component-registry` never statically pulls in the service widgets (or the `@viamrobotics/three` peer they need). Reach for a scoped registry — rather than the composed `/registry`, which references both — when you render only one kind of resource and want the other kind's widgets kept out of your build.

### Optional peer dependencies

A few widgets depend on optional peers. Install a peer only if you render a widget (or import an entry point) that needs it; otherwise it stays out of your build.

| Optional peer         | Required by                                                                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `maplibre-gl`         | `MovementSensorWidget` (a **component** — plots GPS position on a map), `NavigationServiceWidget`, and the `maplibre` / `navigation-map` building blocks |
| `@viamrobotics/three` | `NavigationServiceWidget` (navigation-map 3D geometry)                                                                                                   |

So a component-only consumer needs `maplibre-gl` only if it renders `MovementSensorWidget`, and never needs `@viamrobotics/three`. A consumer that renders service widgets (or imports `/service-registry` or the composed `/registry`) needs both.

## Playground

The playground (`pnpm dev`) can be used to develop the test-cards against prod robots with prod modules.

This is useful if you need to validate the sdk against specific behavior of modules or need to replicate a bug from another robot (why replicate locally when you could just develop directly against the robot with the bug?).

To setup your playground, create a `.env.local` in the test-widgets directory with the following format (no need to create two robots):

```json
VITE_PLAYGROUND_ROBOTS='
{
  "some prod robot": {
    "host": "fleet-rover-01-main.ve4ba7w5qr.viam.cloud",
    "partId": "<PART-ID>",
    "apiKeyId": "<API-KEY-ID>",
    "apiKeyValue": "<API-KEY-VALUE>",
    "signalingAddress": "https://app.viam.com:443"
  },
  "some staging robot name": {
    "host": "fleet-rover-02-main.ytobojb44p.viamstg.cloud",
    "partId": "<PART-ID>",
    "apiKeyId": "<API-KEY-ID>",
    "apiKeyValue": "<API-KEY-VALUE>",
    "signalingAddress": "https://app.viam.dev:443"
  },
  "local-machine (no fqdn)": {
    "host": "localhost:8080",
    "serviceHost": "http://localhost:8080",
    "partId": "local-machine (no fqdn)",
    "signalingAddress": ""
  },
  "local-machine (fqdn)": {
    "host": "something-unique",
    "serviceHost": "http://localhost:8080",
    "partId": "local-machine (fqdn)",
    "signalingAddress": ""
  }
}
'
```
