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

- **`@viamrobotics/test-widgets/registry`** — the lookups `apiWidgetsForResource(resource)`, `widgetForResource(resource)`, and `availableAPIWidgets()`, which resolve any resource, component or service. Each API entry has a `kind`. An `api` entry renders one RDK method and is labeled with its name. A `control` entry is a control interface that is not bound to one method, such as quick move. The registry references every widget, so importing it pulls **all** widgets, `maplibre-gl` included, into your build. Keeping these lookups out of the root is what lets the root stay tree-shakeable.

### maplibre-gl

`maplibre-gl` is a required peer and by far the heaviest one. It reaches your bundle only if you import something that renders a map: `MovementSensorWidget`, `NavigationServiceControls`, the `maplibre` and `navigation-map` building blocks, or `/registry`. `NavigationServiceWidget` is a stack of API widgets and draws no map. Otherwise it is tree-shaken out.

## Embedding

### Stylesheet

The widgets are styled with Tailwind 4 utility classes, so your Tailwind build has to generate them. Import the stylesheets once, in this order:

```css
@import 'tailwindcss';
@import '@viamrobotics/prime-ui/styles.css';
@import '@viamrobotics/prime-controls/styles.css';
@import '@viamrobotics/test-widgets/styles.css';
```

Each one imports `@viamrobotics/tailwind-config` and points Tailwind at its own compiled components.

Tailwind 4 draws an unset `border` in `currentcolor`. Some widgets rely on the Tailwind 3 default instead, so copy the compatibility block from this repo's `src/app.css` into your base layer. The package stylesheet leaves it out, because it would change every border on your page.

### Peers

Install these in your app. The ranges come from this package's `peerDependencies`:

- `@sentry/svelte` `>=8`
- `@tanstack/svelte-query` `>=6`
- `@threlte/core` `>=8`
- `@threlte/extras` `>=9`
- `@viamrobotics/prime-controls` `>=0.5`
- `@viamrobotics/prime-editor` `>=0.1`
- `@viamrobotics/prime-ui` `>=0.6`
- `@viamrobotics/sdk` `>=0.76.0`
- `@viamrobotics/svelte-sdk` `>=1.5`
- `@viamrobotics/tailwind-config` `>=1.10`
- `lodash-es` `>=4`
- `maplibre-gl` `>=6`
- `runed` `>=0.28`
- `svelte` `>=5`
- `three` `>=0.178`
- `threlte-uikit` `>=2`

### Providers

Mount these once, above any widget:

- `ViamProvider` from `@viamrobotics/svelte-sdk`, with `dialConfigs` for each part a widget talks to. A widget outside it throws.
- `providePip()` from `@viamrobotics/test-widgets`, before rendering a camera widget.

Each widget takes the `partID` and `resourceName` of the resource it controls.

### Sizes

Every registry entry carries a `size` of type `ResourceWidgetSize`: `minWidth`, `minHeight`, `recommendedWidths`, and `maxWidth`, in px. A host uses them to size, snap, or cap the box it renders a widget in. Each number is the widget's own box, without any header, padding, or border the host draws around it. `widgetSizeForResource(resource)` from `@viamrobotics/test-widgets/registry` returns a resource's composite size. An API entry's size is its `size` field, from `apiWidgetsForResource(resource)`.

The table lists each resource's composite `minWidth` and each API entry's `minWidth`, keyed by entry id, all in px. Resources with no API entries have none listed.

| Resource        | Composite | API entries                                                                                                                                                                                                                                       |
| --------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Arm             | 221       | move-to-joint-positions `196`, move-to-position `213`, get-joint-positions `186`, get-end-position `162`, is-moving `96`, manual-mode `193`, set-manual-mode `246`, get-manual-mode `150`, get-properties `224`, stop `92`                        |
| AudioInput      | 108       | controls `108`, get-audio `282`, get-properties `237`                                                                                                                                                                                             |
| AudioOutput     | 114       | controls `114`, play `252`, play-stream `252`, get-properties `237`                                                                                                                                                                               |
| Base            | 243       | quick-move `289`, move-straight `297`, spin `286`, set-power `115`, set-velocity `150`, is-moving `96`, stop `92`, get-properties `243`                                                                                                           |
| Board           | 176       | controls `253`, set-gpio `192`, get-gpio `214`, pwm `214`, set-pwm `214`, pwm-frequency `214`, set-pwm-frequency `269`, read-analog-reader `230`, write-analog `222`, get-digital-interrupt-value `240`, stream-ticks `278`, set-power-mode `150` |
| Button          | 160       |                                                                                                                                                                                                                                                   |
| Camera          | 276       | controls `227`, get-images `182`, get-point-cloud `137`, get-properties `276`                                                                                                                                                                     |
| Encoder         | 211       | get-position `162`, reset-position `150`, get-properties `251`                                                                                                                                                                                    |
| Gantry          | 169       | home `150`, move-to-position `142`, quick-move `190`, get-position `176`, is-moving `96`, get-lengths `183`, stop `92`                                                                                                                            |
| Gripper         | 244       | open-grab `188`, is-holding-something `194`, is-moving `96`, open `81`, grab `115`, stop `92`, get-current-inputs `150`, go-to-inputs `219`                                                                                                       |
| InputController | 211       | get-events `240`, trigger-event `232`                                                                                                                                                                                                             |
| Motor           | 288       | quick-move `276`, set-power `192`, set-rpm `248`, go-for `288`, go-to `268`, is-moving `96`, reset-zero-position `279`, get-position `180`, get-properties `224`, stop `150`, is-powered `150`                                                    |
| MovementSensor  | 239       | get-position `206`, get-orientation `108`, get-compass-heading `209`, get-accuracy `183`, get-linear-velocity `150`, get-angular-velocity `150`, get-linear-acceleration `150`, get-properties `259`, get-readings `150`                          |
| PowerSensor     | 211       | get-voltage `195`, get-current `187`, get-power `176`, get-readings `150`                                                                                                                                                                         |
| Sensor          | 259       |                                                                                                                                                                                                                                                   |
| Servo           | 169       | move `276`, quick-move `95`, is-moving `96`, get-position `140`, stop `92`                                                                                                                                                                        |
| Switch          | 179       | set-position `150`, get-position `150`, get-number-of-positions `150`                                                                                                                                                                             |
| Discovery       | 189       | controls `217`, discover-resources `170`                                                                                                                                                                                                          |
| MLModel         | 286       | metadata `286`, infer `235`                                                                                                                                                                                                                       |
| Motion          | 240       |                                                                                                                                                                                                                                                   |
| Navigation      | 116       | controls `248`, get-mode `108`, set-mode `248`, get-location `141`, get-waypoints `137`, add-waypoint `257`, remove-waypoint `180`, get-obstacles `232`, get-paths `177`, get-properties `150`                                                    |
| Slam            | 223       | controls `248`, get-position `223`, get-point-cloud-map `165`, get-properties `244`, get-internal-state `184`                                                                                                                                     |
| Vision          | 293       | controls `264`, capture-all-from-camera `272`, get-properties `263`, get-object-point-clouds `200`, get-detections-from-camera `230`, get-classifications-from-camera `230`, get-detections `269`, get-classifications `269`                      |

### In a pane

A widget renders its body only, so a host can draw the frame. Wrap a pane's header and body in one `Section.Scope`. The widget registers its method, loading state, and errors there, and drops its own heading row. Your header then draws the method, the docs link, and the error indicator.

```svelte
<script lang="ts">
	import { Panes } from '@viamrobotics/prime-panes'
	import { MotorSetPowerWidget, Section } from '@viamrobotics/test-widgets'

	const { partID }: { partID: string } = $props()
</script>

{#snippet pane()}
	<Section.Scope>
		<Panes.DragTrigger>
			<header class="flex items-center gap-1">
				<h2>motor-1 › <Section.Method /></h2>
				<Section.Docs />
				<Section.Errors />
				<Panes.MoveTrigger aria-label="Move motor-1 SetPower" />
			</header>
		</Panes.DragTrigger>
		<Panes.PaneBody>
			<Section.Loading />
			<MotorSetPowerWidget
				{partID}
				resourceName="motor-1"
			/>
		</Panes.PaneBody>
	</Section.Scope>
{/snippet}
```

Keep every field in the body. The whole header is the drag handle, so a control with a drag gesture of its own, such as a scrubbing number field, never sits inside `Panes.DragTrigger`. The `/panes` route in the playground is a full example, with split, stacked, and floating panes and a resource tree. `@viamrobotics/prime-panes` is the playground's choice, not a dependency of this package.

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
