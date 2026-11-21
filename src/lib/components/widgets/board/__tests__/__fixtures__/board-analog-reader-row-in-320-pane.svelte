<script lang="ts">
	import '../../../../../../app.css'

	import type { BoardNamedRowProps } from '../../board-control-row-props'

	import BoardAnalogReaderRow from '../../board-analog-reader-row.svelte'

	const props: BoardNamedRowProps = $props()
</script>

<div
	data-testid="pane"
	class="w-80"
>
	<BoardAnalogReaderRow {...props} />
</div>
