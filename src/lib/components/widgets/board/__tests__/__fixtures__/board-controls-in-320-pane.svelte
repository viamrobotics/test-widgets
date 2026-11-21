<script lang="ts">
	import '../../../../../../app.css'
	import BoardControls from '../../board-controls.svelte'

	interface Props {
		analogReaders?: string[]
		digitalInterrupts?: string[]
	}

	const { analogReaders, digitalInterrupts }: Props = $props()
</script>

<div
	data-testid="pane"
	class="w-80"
>
	<BoardControls
		partID="test-part"
		resourceName="test-board"
		{analogReaders}
		{digitalInterrupts}
	/>
</div>
