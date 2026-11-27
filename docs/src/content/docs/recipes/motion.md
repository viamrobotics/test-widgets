---
title: Motion
description: Compose the motion widget into a test card.
---

This page shows how to lay out the `Motion` widget on one page as a test card.

The recipe wraps its widget in one `<WidgetsProvider>`. `Motion` has one widget, `Move`, so no conflict group exists. `Move` calls the Motion API's Move method for a frame chosen from the machine's frame system.

The recipe follows the same three-layer order. The service has no glance row and no queries, so the recipe is the mutator layer alone.

`Move` offers every movable frame in the frame system config as the component, and the destination frame defaults to the component's parent. It fills the pose editor with the component's current pose in the destination frame.

## Test card

The section is headed by the API method it calls.

```svelte
<script lang="ts">
	import { Motion, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'builtin'
</script>

<WidgetsProvider>
	<div class="@container flex flex-col">
		<Motion.Move
			{partID}
			{resourceName}
		/>
	</div>
</WidgetsProvider>
```
