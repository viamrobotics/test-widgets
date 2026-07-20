# @viamrobotics/test-widgets

A library of Svelte components for interacting with Viam-powered machines. Each widget provides a test interface for a specific resource type -- arms, bases, cameras, motors, sensors, and more -- allowing users to send commands, view live data, and control hardware directly from the browser.

Also includes reusable building blocks for visualizations, such as maps (MapLibre), SLAM mapping, 3D point clouds (Three.js), etc.

## Entry points

Most consumers import widget components directly from the package root and render them statically:

```ts
import { ArmWidget, CameraWidget } from '@viamrobotics/test-widgets'
```

If instead you need to **dynamically** resolve which widgets a resource supports at runtime (for example, a control panel that lists every API of every resource on a scanned machine), import one of the registry entry points:

- **`@viamrobotics/test-widgets/component-registry`** exposes `componentWidgetRegistry` and its query APIs `componentApiWidgets(resource)` / `componentWidgetForResource(resource)` for `rdk:component:*` resources. Prefer it when you only render component widgets.
- **`@viamrobotics/test-widgets/service-registry`** exposes `serviceWidgetRegistry` and its query APIs `serviceApiWidgets(resource)` / `serviceWidgetForResource(resource)` for `rdk:service:*` resources (motion, navigation, slam, vision).

```ts
import {
	componentApiWidgets,
	componentWidgetForResource,
} from '@viamrobotics/test-widgets/component-registry'
```

The root's `apiWidgetsForResource` composes both registries, so importing anything from the root pulls the service widgets (and their optional peers) into your build. Import the scoped registry entry point to avoid that.

These are for dynamic, registry-driven resolution only. To use a specific widget, import the component from the root instead.

> [!NOTE]
> The navigation service widgets import `maplibre-gl` and `@viamrobotics/three`. Install those (declared as optional peer dependencies) if you use those widgets or the `service-registry`.

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
