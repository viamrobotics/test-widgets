<script lang="ts">
	import '../../../../../../app.css'

	import type { appRobotApi } from '@viamrobotics/sdk'

	import type { ComponentPreview } from '../../component-preview'

	import DiscoveryControls from '../../DiscoveryControls.svelte'

	interface Props {
		onAddComponent?: (component: appRobotApi.ComponentConfig) => void
		withPreview?: boolean
		/** 672 px, the `@2xl` container width, instead of 320 px. */
		isWide?: boolean
	}

	const { onAddComponent, withPreview = false, isWide = false }: Props = $props()

	const previewText = (current: ComponentPreview) => {
		if (current.loading) return 'loading'
		return current.preview ?? 'none'
	}
</script>

{#snippet preview(current: ComponentPreview)}
	<p>{current.component.name}: {previewText(current)}</p>
{/snippet}

<div
	data-testid="pane"
	class={isWide ? 'w-168' : 'w-80'}
>
	<DiscoveryControls
		partID="test-part"
		resourceName="test-discovery"
		{onAddComponent}
		componentPreview={withPreview ? preview : undefined}
	/>
</div>
