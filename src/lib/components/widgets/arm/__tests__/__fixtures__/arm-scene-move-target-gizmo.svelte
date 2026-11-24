<script lang="ts">
	import type { MoveTarget, MoveTargetGizmoProps } from '@viamrobotics/visualization/scoped-scene'

	import { FIRST_TARGET, SECOND_TARGET } from './arm-scene-targets'

	let { frame, target = $bindable(), onDrag, onRelease }: MoveTargetGizmoProps = $props()

	// A real drag writes the bound target on every move, then reports the final goal once.
	const drag = (goal: MoveTarget) => {
		target = goal
		onDrag?.(goal)
		onRelease?.(goal)
	}
</script>

<div
	data-testid="move-target-gizmo"
	data-frame={frame}
>
	<button
		type="button"
		onclick={() => drag(FIRST_TARGET)}
	>
		Drag to first target
	</button>
	<button
		type="button"
		onclick={() => drag(SECOND_TARGET)}
	>
		Drag to second target
	</button>
</div>
