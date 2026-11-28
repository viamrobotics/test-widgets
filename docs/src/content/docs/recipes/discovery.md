---
title: Discovery
description: Compose the discovery widget into a test card or a control interface.
---

This page shows how to lay out the `Discovery` widgets on one page as a test card or a control interface.

Each recipe wraps its widgets in one `<WidgetsProvider>`. The widgets for one discovery service find each other through it by `partID` and `resourceName`. `DiscoverResources` and `ResourcePreview` are both queries, so no conflict group exists and both stay live.

The recipes follow the same three-layer order. A discovery service has no glance row and no mutators, so each recipe is the query layer alone.

## Test card

The section is headed by the API method it calls.

```svelte
<script lang="ts">
	import { Discovery, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'discovery-1'
</script>

<WidgetsProvider>
	<div class="@container flex flex-col">
		<Discovery.DiscoverResources
			{partID}
			{resourceName}
		/>
	</div>
</WidgetsProvider>
```

## Control interface

`ResourcePreview` groups the discovered configs by name, with a picker for the variants of one resource. Each result has buttons to copy its resource config or its attributes. An optional `onAddComponent` handler adds an Add to config button that receives the chosen config. An optional `componentPreview` snippet draws a preview of the chosen variant from the service's `preview` DoCommand. It reads on demand by default. Its refresh row starts paused with Resume and Refresh buttons, and offers the rate picker once resumed.

```svelte
<script lang="ts">
	import { Discovery, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'discovery-1'
</script>

<WidgetsProvider>
	<div class="@container flex flex-col">
		<Discovery.ResourcePreview
			{partID}
			{resourceName}
		/>
	</div>
</WidgetsProvider>
```
