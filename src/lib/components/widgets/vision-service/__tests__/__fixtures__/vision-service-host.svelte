<script lang="ts">
	import '../../../../../../app.css'

	import { untrack } from 'svelte'

	import { createAddImageToDatasetContext, type ImageData } from '$lib/add-image-to-dataset'
	import { providePip } from '$lib/pip/context.svelte'

	import VisionServiceWidget from '../../vision-service.svelte'

	interface Props {
		/** Provides picture-in-picture above the widget, as the app does. */
		withPip?: boolean
		/** Provides the legacy dataset context with this handler. */
		onAddImage?: (imageData: ImageData) => void
		/** Classes on the pane around the widget, such as `w-80` for a 320 px pane. */
		paneClass?: string
	}

	const { withPip = false, onAddImage, paneClass }: Props = $props()

	// Contexts are set once at init, so the props' first values decide them.
	untrack(() => {
		if (withPip) providePip(() => 'test-part')
		if (onAddImage) createAddImageToDatasetContext(onAddImage)
	})
</script>

<div
	data-testid="pane"
	class={paneClass}
>
	<VisionServiceWidget
		partID="test-part"
		resourceName="test-vision"
	/>
</div>
