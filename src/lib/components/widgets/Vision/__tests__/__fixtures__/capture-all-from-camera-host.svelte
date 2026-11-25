<script lang="ts">
	import '../../../../../../app.css'

	import { untrack } from 'svelte'

	import { createAddImageToDatasetContext, type ImageData } from '$lib/add-image-to-dataset'

	import CaptureAllFromCameraWidget from '../../capture-all-from-camera-widget.svelte'

	interface Props {
		/** Provides the legacy dataset context with this handler. */
		onAddImage: (imageData: ImageData) => void
		cameraName?: string
	}

	const { onAddImage, cameraName }: Props = $props()

	// Contexts are set once at init, so the first handler decides it.
	untrack(() => createAddImageToDatasetContext(onAddImage))
</script>

<div class="w-80">
	<CaptureAllFromCameraWidget
		partID="test-part"
		resourceName="test-vision"
		{cameraName}
	/>
</div>
