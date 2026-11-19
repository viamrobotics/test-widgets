<script lang="ts">
	import {
		type AddImageToDatasetForm,
		createAddImageToDatasetContext,
		type ImageData,
		useAddImageToDataset,
		useAddToDatasetAction,
	} from '$lib/add-image-to-dataset'

	interface Props {
		provide: boolean
		handler?: ((imageData: ImageData) => void) | AddImageToDatasetForm
		onAction: (getAction: ReturnType<typeof useAddToDatasetAction>) => void
		onLegacy: (
			addImageToDataset: ReturnType<typeof useAddImageToDataset>['addImageToDataset']
		) => void
	}

	const props: Props = $props()

	const setup = () => {
		if (props.provide) {
			createAddImageToDatasetContext(props.handler)
		}

		props.onAction(
			useAddToDatasetAction(() => ({
				partID: 'part-1',
				cameraName: 'cam-1',
				methodName: 'GetImages',
			}))
		)
		props.onLegacy(useAddImageToDataset().addImageToDataset)
	}

	setup()
</script>
