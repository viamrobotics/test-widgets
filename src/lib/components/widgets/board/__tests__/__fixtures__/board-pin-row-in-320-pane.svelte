<script lang="ts">
	import '../../../../../../app.css'

	import type { BoardNamedRowProps } from '../../board-control-row-props'

	import BoardPinRow from '../../board-pin-row.svelte'

	const props: BoardNamedRowProps = $props()
</script>

<div
	data-testid="pane"
	class="w-80"
>
	<BoardPinRow {...props} />
</div>
