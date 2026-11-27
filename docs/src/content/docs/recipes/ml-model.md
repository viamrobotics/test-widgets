---
title: ML model
description: Compose the ML model service widgets into a test card.
---

This page shows how to lay out the `MLModel` widgets on one page as a test card that exercises each API method.

The recipe wraps its widgets in one `<WidgetsProvider>`. The widgets for one ML model service find each other through it by `partID` and `resourceName`, so no prop wires one widget to another. No two `MLModel` widgets call the same method, so none share a conflict group. `Infer` is the only call that runs the model, and `Metadata` reads once.

The recipe follows the same three-layer order:

1. A glance row. The service has no state worth a row of its own, so the recipe skips it.
2. The mutators. `Infer` runs the model and changes nothing on the machine, so it sits with the queries.
3. The queries, here `Metadata` then `Infer`. `Infer` reads the input and output shapes that `Metadata` reports.

## Test card

Each section is headed by the API method it calls.

```svelte
<script lang="ts">
	import { MLModel, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'ml-model-1'
</script>

<WidgetsProvider>
	<div class="@container flex flex-col divide-y">
		<MLModel.Metadata
			{partID}
			{resourceName}
		/>
		<MLModel.Infer
			{partID}
			{resourceName}
		/>
	</div>
</WidgetsProvider>
```
