<script lang="ts">
	import MoveToPositionControl from './move-to-position-control.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()
</script>

<MoveToPositionControl
	{partID}
	{resourceName}
/>
