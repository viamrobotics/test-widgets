<script lang="ts">
	import HeldBack from '../../HeldBack.svelte'

	interface Props {
		/** `undefined` holds the button back until a point cloud has loaded. */
		data: Uint8Array | undefined
	}

	const { data }: Props = $props()

	const blockedReason = $derived(data === undefined ? 'No point cloud has loaded yet.' : undefined)

	const downloadRawData = () => {
		if (data === undefined) return
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

<HeldBack reason={blockedReason}>
	{#snippet children(heldBack)}
		<button
			type="button"
			class="button button-xs"
			{...heldBack}
			onclick={downloadRawData}
		>
			Download raw data
		</button>
	{/snippet}
</HeldBack>
