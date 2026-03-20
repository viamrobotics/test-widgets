<script lang="ts">
	import ReadWritePins from './read-write-pins.svelte';

	interface Props {
		partID: string;
		resourceName: string;
	}

	const { partID, resourceName }: Props = $props();
</script>

<ReadWritePins
	{partID}
	{resourceName}
/>
