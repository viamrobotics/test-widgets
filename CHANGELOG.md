# @viamrobotics/test-widgets

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
