---
title: Button
description: Place the button widget on a page.
---

This page shows how to place the `Button` widget on one page. A button has one API method, so there is a test card and no control interface.

The recipe wraps the widget in one `<WidgetsProvider>`, as every recipe does. `Push` shares no state with another widget and joins no conflict group. It ignores a press while its own push is in flight, and the press is dropped, never queued.

The three-layer order has one layer here: `Push` is the mutator. A button has no glance row and no queries.

## Test card

```svelte
<script lang="ts">
	import { Button, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'button-1'
</script>

<WidgetsProvider>
	<div class="p-4">
		<Button.Push
			{partID}
			{resourceName}
		/>
	</div>
</WidgetsProvider>
```
