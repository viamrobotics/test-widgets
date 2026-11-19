<script lang="ts">
	interface Props {
		data: Uint8Array
		label: string
	}

	const { data, label }: Props = $props()
</script>

<div
	data-testid="pcd"
	data-label={label}
	data-bytes={data.length}
></div>
