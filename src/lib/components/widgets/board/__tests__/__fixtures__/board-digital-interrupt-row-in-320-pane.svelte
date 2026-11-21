<script lang="ts">
	import '../../../../../../app.css'

	import type { BoardNamedRowProps } from '../../board-control-row-props'

	import BoardDigitalInterruptRow from '../../board-digital-interrupt-row.svelte'

	const props: BoardNamedRowProps = $props()
</script>

<div
	data-testid="pane"
	class="w-80"
>
	<BoardDigitalInterruptRow {...props} />
</div>
