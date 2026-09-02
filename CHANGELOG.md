# @viamrobotics/test-widgets

## 0.12.0

### Minor Changes

- 70ec413: The arm MoveToPosition widget can now route moves through a motion service Move call for planned, obstacle-aware movement. When the machine has a motion service, motion mode is the default with an info banner, and direct arm control sits behind a toggle with a danger warning. With more than one motion service, a select chooses which service handles the move, defaulting to builtin. With no motion service the widget keeps the direct path and shows the danger banner.
- 813d5f4: Source resource lists from machine status, so a resource going unhealthy no longer drops out of the list.

## 0.11.3

### Patch Changes

- e301ca9: SLAM, navigation, and movement-sensor widgets stack their controls above the map in narrow cards, with the map keeping an explicit height, using container queries
- dd37db9: Arm widget switches between Joint Positions and Quick Move with visible toggle buttons.

## 0.11.2

### Patch Changes

- b6b24b3: Arm, encoder, and power-sensor widgets collapse to one column in narrow cards via container queries; input-controller, ML model, and camera header rows wrap; operations and sessions tables scroll horizontally inside their box instead of truncating

## 0.11.1

### Patch Changes

- 1df117f: Motor, base, and gantry widgets stack their Stop/IsMoving sidebar below the controls and wrap their input rows when the card is narrow, using container queries like the servo and gripper widgets

## 0.11.0

### Minor Changes

- c412787: Responsive design pass

### Patch Changes

- 94cb1e1: Fix whitespace in <pre/>

## 0.10.2

### Patch Changes

- 5202b79: Dedupe errors in `Queries` so widgets passing multiple queries against one client no longer crash with `each_key_duplicate` when those queries fail identically

## 0.10.1

### Patch Changes

- 02ed7e0: Export `supportsDoCommand` utility, helpful for building dynamic APIs with the registry
- b622997: Add `ResourceDoCommandWidget`, a registry-conforming DoCommand widget that takes `{ partID, resourceName }` and resolves the full `ResourceName` internally, so it can be dropped into the resource widget registry alongside the other `ResourceWidget`s.

## 0.10.0

### Minor Changes

- 14aa9d9: Auto-show the camera feed by default and add an opt-in "Wait to start feed" toggle persisted per part and component

### Patch Changes

- 99e9828: Reset destination to parent frame on frame select in motion widget
- 9c0912d: Consolidate components into reusable units and bug fix events on the pcd widget

## 0.9.2

### Patch Changes

- d0d6746: deps: remove `@viamrobotics/three` dependency

## 0.9.1

### Patch Changes

- 52a1016: Update motion service widget to have separate `Move` widget and full card with frame and parent select.

## 0.9.0

### Minor Changes

- 6148810: Add optional controlled `input` and `onInputChange` props to `DoCommandWidget` so callers can set the editor value without going through the header snippet
- 09dc32c: Move the registry lookups (`apiWidgetsForResource`, `widgetForResource`, `availableAPIWidgets`) to a new `/registry` entry point so the package root stays tree-shakeable, and declare `maplibre-gl` and `@viamrobotics/three` as optional peer dependencies.
- f9ffc76: Add motion service move widget

## 0.8.0

### Minor Changes

- bebbe29: Deprecate `hasWidget` for `isKnownResource`
- 97c3e3f: Add `widgetForResource` and `apiWidgetsForResource` lookups and export granular widgets.
- 3d9e3c8: Display units of measurement in arm and motor test cards for clarity

### Patch Changes

- 6e1a1ea: Add warning tooltip to move-to-position arm widget about motion service and frame system
- 9260b41: Fix arm joint position sliders erroring for URDF/XML kinematics files
- c41481b: APP-17127: scope base quick-move WASD keys to capture phase
- ae37ee1: Fix "Is remote?" toggle on the vision service test card so its click target no longer spans the full card width
- eb52cdb: Fix content overflow in motor, gripper, and is-moving test cards by removing fixed-height query content constraints
- eea1966: fix: re-use camera stream when available for pip

## 0.7.0

### Minor Changes

- bb329c0: Render resource API-method headers (GetPosition, MoveToPosition, etc.) as monospace links to the docs API reference. Adds a shared `SectionTitle` component and an `apiDocsHref(api, method)` helper, both exported from the package. `ApiSection`/`MutationSection` take an optional `api` prop (e.g. `"rdk:component:camera"`); the method name is derived from the title and the docs URL is built internally, so callers only pass `api`.

### Patch Changes

- a6a56c6: fix: bump svelte to fix vision test card hang
- 13153b4: Add click highlighting for vision service detection instances.

## 0.6.1

### Patch Changes

- fd9d0cf: Add support for gpano cameras

## 0.6.0

### Minor Changes

- faf0e41: Add an optional `header` snippet prop to `DoCommandWidget`, rendered above the input/output editor row. It receives `{ input, setInput }` so callers can read the current editor input and replace it (useful for "save as favorite" / "apply favorite" flows).

## 0.5.0

### Minor Changes

- 3317d24: feat: allow pasting for moveToPositions and moveToPose widgets"
- 34dedf6: support 360 camera images with special XMP metadata
- 744bd55: feat: display joint limits before executing moveToJointPositions

### Patch Changes

- ea7611d: Fix camera source selection and handle Viam depth mimetype
- 716e21b: fix: make base card quick move section expand to fill space

## 0.4.0

### Minor Changes

- 3f8110c: Add `IsHoldingSomething` widget

### Patch Changes

- 3f8110c: Fix circular imports

## 0.3.1

### Patch Changes

- 75f49be: Fix circular dependency in resource.ts

## 0.3.0

### Minor Changes

- f0b054f: Export `widgetForResource`, `showResourceWidget`, `hasWidget`, `getResourceAPI`, and `clientForResource`.

## 0.2.0

### Minor Changes

- 8ec8a0e: Add `AudioInputWidget` and `AudioOutputWidget` components for audio in/out resources

### Patch Changes

- ebfdd5d: Add copy button to error display and prevent re-rendering unchanged errors during query polling
- 5e64fef: Remove `prime-editor` dependency, use code editor from `prime-core`

## 0.1.11

### Patch Changes

- 05cd71c: Add play button to camera widget to start the feed on demand
- c5e89cd: Update vision service widget to use "Default camera" (empty string) camera name option

## 0.1.10

### Patch Changes

- 9641fbb: Show slow loading indicator for vision service widget
- 0568d73: Add source dropdown to camera widget

## 0.1.9

### Patch Changes

- 2e3da38: Add Claude workflows and auto-bump workflow for `app`
- 4906f00: Fix: incorrect sizing for bounding boxes in vision service card

## 0.1.8

### Patch Changes

- 094a81f: Fix stale joint positions in GetJointPositions by using a stable `index` key in the `#each` block

## 0.1.7

### Patch Changes

- 8eee8e6: Fix joint position key

## 0.1.6

### Patch Changes

- a79f186: [APP-15834] Keep picture-in-picture active across resource switches

## 0.1.5

### Patch Changes

- 36d2ebe: Fix table style exports

## 0.1.4

### Patch Changes

- 965d9fa: Fix live or polling video effect cleanup

## 0.1.3

### Patch Changes

- 59630a3: Set correct peer dependencies

## 0.1.2

### Patch Changes

- 51fb9f6: Switched switch widget to SDK-level optimistic updates
- 51fb9f6: Removed Bounding Box Labeler / Image Annotations
- 51fb9f6: Fixed DoCommand to clear output and error before executing
- 51fb9f6: Fixed vision service detections mutation

## 0.1.1

### Patch Changes

- cdb8479: Fix gantry exports

## 0.1.0

### Minor Changes

- c48b97b: Initial release
