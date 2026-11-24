<script lang="ts">
	import type { Stage } from '@threlte/core'

	import { useThrelte } from '@threlte/core'

	interface Props {
		/** Called with an error a per-frame task threw. The canvas keeps rendering. */
		onError: (error: Error) => void
	}

	const { onError }: Props = $props()

	const { scheduler } = useThrelte()

	const toError = (thrown: unknown): Error =>
		thrown instanceof Error ? thrown : new Error(String(thrown), { cause: thrown })

	$effect(() => {
		// Threlte runs stages uncaught, so a throw skips later stages and the render. Each stage's run is wrapped to catch, including stages added after mount.
		const originalSchedulerRun = scheduler.run
		const originalStageRuns = new Map<Stage, Stage['run']>()
		let lastMessage: string | undefined
		let hasFailedThisFrame = false

		const report = (thrown: unknown) => {
			hasFailedThisFrame = true
			const reported = toError(thrown)
			if (reported.message === lastMessage) return
			lastMessage = reported.message
			onError(reported)
		}

		const guardStage = (stage: Stage) => {
			if (originalStageRuns.has(stage)) return
			const originalStageRun = stage.run
			originalStageRuns.set(stage, originalStageRun)
			stage.run = (delta) => {
				try {
					originalStageRun.call(stage, delta)
				} catch (error) {
					report(error)
				}
			}
		}

		scheduler.run = (time) => {
			for (const stage of scheduler.stages) guardStage(stage)
			hasFailedThisFrame = false
			originalSchedulerRun.call(scheduler, time)
			if (!hasFailedThisFrame) lastMessage = undefined
		}

		return () => {
			scheduler.run = originalSchedulerRun
			for (const [stage, originalStageRun] of originalStageRuns) stage.run = originalStageRun
		}
	})
</script>
