<script lang="ts">
	import '../../../../../../app.css'

	import type { Component } from 'svelte'

	import { createAddImageToDatasetContext, type ImageData } from '$lib/add-image-to-dataset'

	interface Props {
		widget: Component<{ partID: string; resourceName: string }>
		/** The pane's width class, 320 px by default. */
		widthClass?: string
		onAddImage?: (imageData: ImageData) => void
	}

	const { widget: Widget, widthClass = 'w-80', onAddImage }: Props = $props()

	createAddImageToDatasetContext((imageData) => onAddImage?.(imageData))
</script>

<div
	data-testid="pane"
	class={widthClass}
>
	<Widget
		partID="test-part"
		resourceName="test-camera"
	/>
</div>
