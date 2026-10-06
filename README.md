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

- **`@viamrobotics/test-widgets/registry`** — the lookups `apiWidgetsForResource(resource)`, `widgetForResource(resource)`, and `availableAPIWidgets()`, which resolve any resource, component or service. The registry references every widget, so importing it pulls **all** widgets, `maplibre-gl` included, into your build. Keeping these lookups out of the root is what lets the root stay tree-shakeable.

### maplibre-gl

`maplibre-gl` is a required peer and by far the heaviest one. It reaches your bundle only if you import something that renders a map: `MovementSensorWidget`, `NavigationServiceWidget`, the `maplibre` and `navigation-map` building blocks, or `/registry`. Otherwise it is tree-shaken out.

## Playground

The playground (`pnpm dev`) can be used to develop the test-cards against prod robots with prod modules.

This is useful if you need to validate the sdk against specific behavior of modules or need to replicate a bug from another robot (why replicate locally when you could just develop directly against the robot with the bug?).

The sidebar lists your machines. The `?machine=<name>` search param picks which one the playground shows, and the first machine is the default.

A `.env.local` in the test-widgets directory is optional. It seeds the list with the following format (no need to create two robots):

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

You can also add machines from the sidebar. Paste one machine config with a `name`, or a whole `VITE_PLAYGROUND_ROBOTS` value, into the form and submit. Machines added this way are kept in your browser's localStorage, and you can remove them from the sidebar. Machines from `.env.local` cannot be removed there.

### Hosted playground and docs

Every push to `main` deploys the docs site to `https://viamrobotics.github.io/test-widgets/` and the playground to `https://viamrobotics.github.io/test-widgets/playground/`. The docs live in `docs/`, a separate Astro Starlight project. Run them with `pnpm docs:dev`, or build them with the playground included using `pnpm docs:build`.

### PR previews

Each pull request from a branch in this repo deploys the playground to `https://viamrobotics.github.io/test-widgets/pr-preview/pr-<N>/`, and a bot comment links it. The preview has no machines built in, so paste a config into the sidebar form. Closing the pull request removes the preview. Pull requests from forks and Dependabot get no preview.

On GitHub Pages, every `viamrobotics` site shares the `viamrobotics.github.io` origin. Those sites can read the keys stored in localStorage. Use keys for test machines only.
