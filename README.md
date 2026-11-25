# @viamrobotics/test-widgets

A library of Svelte components for interacting with Viam-powered machines. Each widget provides a test interface for a specific resource type -- arms, bases, cameras, motors, sensors, and more -- allowing users to send commands, view live data, and control hardware directly from the browser.

Also includes reusable building blocks for visualizations, such as maps (MapLibre), SLAM mapping, 3D point clouds (Three.js), etc.

## Entry points

There is a root entry and a `/widgets` entry. Which you reach for depends on whether you name widgets **statically** or resolve them **dynamically** at runtime.

### Static use

Each resource has a namespace on the root, and each widget is a member of it. Wrap the page in one `WidgetsProvider`, then render the widgets you need:

```svelte
<script lang="ts">
	import { Arm, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
</script>

<WidgetsProvider>
	<Arm.Jog
		{partID}
		resourceName="arm-1"
	/>
</WidgetsProvider>
```

Mount one `WidgetsProvider` per page. Widgets for the same `partID` and `resourceName` find each other through it, which is how they share a conflict group. A widget rendered without a provider above it throws. Importing one widget from the root pulls in only that widget.

### Dynamic use

If you resolve widgets at runtime from a resource, import the catalog. A control panel that lists every widget of every resource on a scanned machine is the typical host.

```ts
import { resourceWidgets, widgetsForResource } from '@viamrobotics/test-widgets/widgets'
```

- **`resourceWidgets`** is every resource's widgets, keyed by API triplet.
- **`widgetsForResource(resource)`** returns the entry for a `ResourceName`, or `undefined` for a resource with no widgets.

An entry holds `widgets`, keyed by id. Each widget has a `component`, a `kind`, and a `size`:

```ts
widgetsForResource(armResourceName)?.widgets.jog
// { component: Arm.Jog, kind: 'control', size: { width: { min: 'xs', max: 'xs' }, height: 'lg' } }
```

Render a `component` with the `partID` and `resourceName` props every widget takes, inside the same `WidgetsProvider`.

The catalog is a separate entry because it references every widget. Importing it pulls **all** widgets into your build. Keeping it out of the root is what lets the root stay tree-shakeable.

#### Keys and kinds

A widget's key is its namespace member in camelCase, such as `moveToJointPositions` for `Arm.MoveToJointPositions`. A key is safe to persist as a widget id. The keys list in declared order, which a menu can keep.

If you persisted the old kebab slugs, convert each one once, for example `move-to-joint-positions` to `moveToJointPositions`.

`kind` says what a widget is. An `api` widget renders one RDK method, and its key is that method's name in camelCase. A `control` widget is bound to no one method, such as `Base.QuickMove`.

### maplibre-gl

`maplibre-gl` is a required peer and by far the heaviest one. The map API on the root, such as `MapLibre`, its controls and markers, the projection functions, and the Three.js hooks, comes from `@viamrobotics/prime-map`, a dependency of this package that takes `maplibre-gl` as its own peer. It reaches your bundle through the `Navigation.Map` and `MovementSensor.PositionMap` widgets, the `NavigationMap` root export, and those map exports. The `/widgets` entry imports every widget, so it always pulls `maplibre-gl` in. From the root, it is tree-shaken out unless you import one of them.

## Embedding

### Stylesheet

The widgets are styled with Tailwind 4 utility classes, so your Tailwind build has to generate them. Import the stylesheets once, in this order:

```css
@import 'tailwindcss';
@import '@viamrobotics/prime-ui/styles.css';
@import '@viamrobotics/prime-controls/styles.css';
@import '@viamrobotics/prime-map/styles.css';
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
- `@viamrobotics/prime-controls` `>=0.6`
- `@viamrobotics/prime-editor` `>=0.1`
- `@viamrobotics/prime-ui` `>=0.7`
- `@viamrobotics/sdk` `>=0.76.0`
- `@viamrobotics/svelte-sdk` `>=1.5`
- `@viamrobotics/tailwind-config` `>=1.12`
- `lodash-es` `>=4`
- `maplibre-gl` `>=6`
- `runed` `>=0.28`
- `svelte` `>=5`
- `three` `>=0.178`
- `threlte-uikit` `>=2`

### Providers

Mount these once, above any widget:

- `ViamProvider` from `@viamrobotics/svelte-sdk`, with `dialConfigs` for each part a widget talks to. A widget outside it throws.
- `WidgetsProvider` from `@viamrobotics/test-widgets`, once per page. A widget outside it throws.
- `providePip()` from `@viamrobotics/test-widgets`, before rendering a camera widget.

Each widget takes the `partID` and `resourceName` of the resource it controls.

### Layouts

A widget does one job. To lay out several for one resource, such as a test card or a control interface, follow the recipe for that resource:

- [Arm](docs/src/content/docs/recipes/arm.md)
- [Base](docs/src/content/docs/recipes/base.md)
- [Board](docs/src/content/docs/recipes/board.md)
- [Camera](docs/src/content/docs/recipes/camera.md)
- [Gantry](docs/src/content/docs/recipes/gantry.md)
- [Gripper](docs/src/content/docs/recipes/gripper.md)
- [Motor](docs/src/content/docs/recipes/motor.md)
- [Movement sensor](docs/src/content/docs/recipes/movement-sensor.md)
- [Navigation](docs/src/content/docs/recipes/navigation.md)
- [Power sensor](docs/src/content/docs/recipes/power-sensor.md)
- [Sensor](docs/src/content/docs/recipes/sensor.md)
- [Servo](docs/src/content/docs/recipes/servo.md)
- [SLAM](docs/src/content/docs/recipes/slam.md)
- [Vision](docs/src/content/docs/recipes/vision.md)

### Config props

Some widgets take optional props that a host fills from the resource's machine config. A given value is enforced or seeds a field. An absent or invalid value leaves the widget as it is without one. A value the resource API reports is never a prop.

| Prop                    | Widgets                           | Config key                                                           |
| ----------------------- | --------------------------------- | -------------------------------------------------------------------- |
| `minDegrees`            | `Servo.MoveTo`, `Servo.QuickMove` | `min_angle_deg`                                                      |
| `maxDegrees`            | `Servo.MoveTo`, `Servo.QuickMove` | `max_angle_deg`. A given maximum removes the Max field of `MoveTo`.  |
| `axisNames`             | `Gantry.QuickMove`                | multi-axis `subaxes_list`, used when its length matches `GetLengths` |
| `defaultSpeedsMmPerSec` | `Gantry.QuickMove`                | each axis's `gantry_mm_per_sec`. Speed starts at the smallest.       |
| `maxRpm`                | `Motor.Move`, `Motor.QuickMove`   | gpio `max_rpm`                                                       |
| `minPowerPct`           | `Motor.QuickMove`                 | gpio `min_power_pct`, a fraction from 0 to 1                         |
| `maxPowerPct`           | `Motor.QuickMove`                 | gpio `max_power_pct`, a fraction from 0 to 1                         |

### Sizes

Every catalog entry carries a `size` of type `WidgetSize`. A host uses it to size, snap, or cap the box it renders a widget in. Each size is the widget's own box, without any header, padding, or border the host draws around it.

```ts
interface WidgetSize {
	width: { min: WidthClass; max: WidthClass | 'fill' }
	height: HeightBand
}
```

**Width.** A width class is named for Tailwind's container sizes. The widgets switch layout at exactly these widths through `@xs:` and `@2xl:` container classes. `min` is the class floor, and a box narrower than it makes the widget overflow. `max` is the class past which the widget adds only empty space, and `fill` means it takes any width. `WIDTH_CLASS_PX` maps each class to px:

| Class | px  |
| ----- | --- |
| `xs`  | 320 |
| `2xl` | 672 |
| `4xl` | 896 |

**Height.** A height band is the band the widget's height falls in at its class floor. `HEIGHT_BAND_PX` maps each bounded band to its tallest height in px:

| Band | px                                               |
| ---- | ------------------------------------------------ |
| `sm` | 120                                              |
| `md` | 240                                              |
| `lg` | 480                                              |
| `xl` | no bound, scrolls inside the box a host gives it |

`WIDTH_CLASS_PX`, `HEIGHT_BAND_PX`, and the `WidgetSize`, `WidthClass`, and `HeightBand` types are root exports.

### In a pane

A widget renders its body only, so a host can draw the frame. Wrap a pane's header and body in one `Section.Scope`. The widget registers its method, loading state, and errors there, and drops its own heading row. Your header then draws the method, the docs link, and the error indicator.

```svelte
<script lang="ts">
	import { Panes } from '@viamrobotics/prime-panes'
	import { Motor, Section } from '@viamrobotics/test-widgets'

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
			<Motor.SetPower
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
