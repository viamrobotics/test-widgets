<!--
@component
@deprecated Use `ArmMoveToJointPositionsWidget`. Its jogging mode covers the same per-joint moves,
with joint limits and a jog queue. This widget renders that one and will be removed in a future major.
-->
<script lang="ts">
	import MoveToJointPositionsWidget from './move-to-joint-positions-widget.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()
</script>

<MoveToJointPositionsWidget
	{partID}
	{resourceName}
/>
