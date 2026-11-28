<script lang="ts">
	import type { ResourceWidget, ResourceWidgetProps } from '#lib/resource-widget-types.js'

	import WidgetsProvider from '#lib/WidgetsProvider.svelte'

	/** A widget that renders with its own props in place of the shared `props`. */
	interface WidgetWithProps {
		component: ResourceWidget
		props: ResourceWidgetProps
	}

	interface Props {
		/**
		 * The widget under test. Each widget in an array renders below the one provider. A
		 * `{ component, props }` entry names its own resource, so one provider can hold two.
		 */
		component: ResourceWidget | (ResourceWidget | WidgetWithProps)[]
		props: ResourceWidgetProps
	}

	const { component, props }: Props = $props()

	const withProps = (entry: ResourceWidget | WidgetWithProps): WidgetWithProps =>
		typeof entry === 'function' ? { component: entry, props } : entry

	const widgets = $derived(
		(Array.isArray(component) ? component : [component]).map((entry) => withProps(entry))
	)
</script>

<WidgetsProvider>
	{#each widgets as { component: Widget, props: widgetProps }, index (index)}
		<Widget {...widgetProps} />
	{/each}
</WidgetsProvider>
