<script lang="ts">
	import type { ResourceWidget, ResourceWidgetProps } from '$lib/resource-widget-types'

	import WidgetsProvider from '$lib/widgets-provider.svelte'

	interface Props {
		/** The widget under test. Each widget in an array renders below the one provider. */
		component: ResourceWidget | ResourceWidget[]
		props: ResourceWidgetProps
	}

	const { component, props }: Props = $props()

	const components = $derived(Array.isArray(component) ? component : [component])
</script>

<WidgetsProvider>
	{#each components as Widget, index (index)}
		<Widget {...props} />
	{/each}
</WidgetsProvider>
