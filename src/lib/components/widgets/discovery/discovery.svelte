<script lang="ts">
	import type { appRobotApi } from '@viamrobotics/sdk'

	import type { ComponentPreviewSnippet } from './component-preview'

	import DiscoveryControls from './discovery-controls.svelte'

	interface Props {
		partID: string
		resourceName: string
		/**  A handler for adding a component to the robot. */
		onAddComponent?: ((component: appRobotApi.ComponentConfig) => void) | undefined
		/** A snippet for creating component previews. Requires a `preview` DoCommand to be implemented. */
		componentPreview?: ComponentPreviewSnippet
	}

	const { partID, resourceName, onAddComponent, componentPreview }: Props = $props()
</script>

<DiscoveryControls
	{partID}
	{resourceName}
	{onAddComponent}
	{componentPreview}
/>
