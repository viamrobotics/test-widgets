<script lang="ts">
	import { useTask, useThrelte } from '@threlte/core'

	interface Props {
		counter: { frames: number; renders: number }
		throwFromFrame: number
	}

	const { counter, throwFromFrame }: Props = $props()

	const { renderStage } = useThrelte()

	useTask(() => {
		counter.frames += 1
		if (counter.frames >= throwFromFrame) throw new Error('task boom')
	})

	// Runs after the main stage, so it only counts frames whose main stage finished.
	useTask(
		() => {
			counter.renders += 1
		},
		{ stage: renderStage }
	)
</script>
