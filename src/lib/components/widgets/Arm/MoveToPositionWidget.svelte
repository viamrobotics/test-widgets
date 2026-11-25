<script lang="ts">
	import MoveToPositionControl from './MoveToPositionControl.svelte'

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
