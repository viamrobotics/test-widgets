<script lang="ts">
	import '../../../../../../app.css'

	import type { BoardPowerModeRowProps } from '../../board-control-row-props'

	import BoardPowerModeRow from '../../board-power-mode-row.svelte'

	const props: BoardPowerModeRowProps = $props()
</script>

<div
	data-testid="pane"
	class="w-80"
>
	<BoardPowerModeRow {...props} />
</div>
