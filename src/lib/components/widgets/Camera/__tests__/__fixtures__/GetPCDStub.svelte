<script lang="ts">
	import type { MediaFrameAddToDataset } from '#lib/components/MediaFrame/media-frame-capture.js'

	interface Props {
		data?: Uint8Array
		label: string
		addToDataset?: Omit<MediaFrameAddToDataset, 'capture'>
	}

	const { data, label, addToDataset }: Props = $props()
</script>

<div
	data-testid="pcd"
	data-label={label}
	data-bytes={data?.length}
	data-dataset-method={addToDataset?.methodName}
	data-dataset-resource={addToDataset?.resourceName}
></div>
