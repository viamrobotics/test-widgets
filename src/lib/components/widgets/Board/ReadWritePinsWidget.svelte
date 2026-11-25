<script lang="ts">
	import ReadWritePins from './ReadWritePins.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()
</script>

<ReadWritePins
	{partID}
	{resourceName}
/>
