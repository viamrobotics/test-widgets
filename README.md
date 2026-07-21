# @viamrobotics/test-widgets

A library of Svelte components for interacting with Viam-powered machines. Each widget provides a test interface for a specific resource type -- arms, bases, cameras, motors, sensors, and more -- allowing users to send commands, view live data, and control hardware directly from the browser.

Also includes reusable building blocks for visualizations, such as maps (MapLibre), SLAM mapping, 3D point clouds (Three.js), etc.

## Entry points

There is one root entry plus a registry entry point. Which you reach for depends on whether you name widgets **statically** or resolve them **dynamically** at runtime.

### Static use

Import the widget components you need and render them:

```ts
import { ArmWidget, CameraWidget } from '@viamrobotics/test-widgets'
```

### Dynamic use

If you resolve widgets at runtime from a resource (for example, a control panel that lists every API of every resource on a scanned machine), import the registry:

```ts
import { apiWidgetsForResource, widgetForResource } from '@viamrobotics/test-widgets/registry'
```

- **`@viamrobotics/test-widgets/registry`** — the lookups `apiWidgetsForResource(resource)`, `widgetForResource(resource)`, and `availableAPIWidgets()`, which resolve any resource, component or service. The registry references every widget, so importing it pulls **all** widgets and their optional peers into your build. Keeping these lookups out of the root is what lets the root stay tree-shakeable.

### Optional peer dependencies

A few widgets depend on optional peers. Install a peer only if you render a widget (or import an entry point) that needs it; otherwise it stays out of your build.

| Optional peer         | Required by                                                                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `maplibre-gl`         | `MovementSensorWidget` (a **component** — plots GPS position on a map), `NavigationServiceWidget`, and the `maplibre` / `navigation-map` building blocks |
| `@viamrobotics/three` | `NavigationServiceWidget` (navigation-map 3D geometry)                                                                                                   |

So a consumer that names widgets statically installs a peer only for the widgets it renders: `maplibre-gl` only if it renders `MovementSensorWidget` or `NavigationServiceWidget`, and `@viamrobotics/three` only for `NavigationServiceWidget`. Importing `/registry` references every widget, so it needs both.

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
