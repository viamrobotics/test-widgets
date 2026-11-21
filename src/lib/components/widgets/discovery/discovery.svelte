<script lang="ts">
	import type { appRobotApi } from '@viamrobotics/sdk'

	import type { ComponentPreviewSnippet } from './component-preview'

	import DiscoverResourcesWidget from './discover-resources-widget.svelte'

	interface Props {
		partID: string
		resourceName: string
		/**
		 * @deprecated Moved to `DiscoveryControls`. This widget renders only `DiscoverResources`
		 * and does nothing with this prop.
		 */
		onAddComponent?: ((component: appRobotApi.ComponentConfig) => void) | undefined
		/**
		 * @deprecated Moved to `DiscoveryControls`. This widget renders only `DiscoverResources`
		 * and does nothing with this prop.
		 */
		componentPreview?: ComponentPreviewSnippet
	}

	// eslint-disable-next-line svelte/no-unused-props -- `onAddComponent` and `componentPreview` stay so callers that pass them still type-check until the next major
	const { partID, resourceName }: Props = $props()
</script>

<DiscoverResourcesWidget
	{partID}
	{resourceName}
/>
