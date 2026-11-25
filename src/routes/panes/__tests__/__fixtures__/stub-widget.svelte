<script lang="ts">
	import type { ResourceWidgetProps } from '$lib/resource-widget-types'

	const { resourceName }: ResourceWidgetProps = $props()
</script>

<p>{resourceName} widget</p>
