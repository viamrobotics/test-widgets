<script lang="ts">
	interface Props {
		currentPosition: number
		moveTo: (angle: number) => void
	}

	const STEP_DEGREES = 5

	const { currentPosition, moveTo }: Props = $props()
</script>

<div
	role="group"
	aria-label="Step"
	class="flex flex-wrap items-center gap-2"
>
	<button
		type="button"
		class="button button-xs"
		disabled={currentPosition - STEP_DEGREES < 0}
		onclick={() => {
			moveTo(currentPosition - STEP_DEGREES)
		}}
	>
		−{STEP_DEGREES}°
	</button>
	<button
		type="button"
		class="button button-xs"
		onclick={() => {
			moveTo(currentPosition + STEP_DEGREES)
		}}
	>
		+{STEP_DEGREES}°
	</button>
</div>
