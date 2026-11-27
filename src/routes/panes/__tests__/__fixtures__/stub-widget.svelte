<script lang="ts">
	import type { ResourceWidgetProps } from '#lib/resource-widget-types.js'

	const { resourceName }: ResourceWidgetProps = $props()
</script>

<p>{resourceName} widget</p>
