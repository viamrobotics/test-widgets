<script lang="ts">
	interface Props {
		data: Uint8Array
	}

	const { data }: Props = $props()

	const downloadRawData = () => {
		const file = new File([new Uint8Array(data)], 'pointcloud.pcd', {
			type: 'pointcloud/pcd',
		})
		const url = URL.createObjectURL(file)

		const link = document.createElement('a')
		link.href = url
		link.download = 'pointcloud.pcd'
		link.click()

		URL.revokeObjectURL(url)
	}
</script>

<button
	type="button"
	class="button button-xs"
	onclick={downloadRawData}
>
	Download raw data
</button>
