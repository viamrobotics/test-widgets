<script lang="ts">
	import type { JogDirection } from '#lib/components/jog-target.js'

	import { Select } from '@viamrobotics/prime-controls'
	import { ServoClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'
	import { jogTarget } from '#lib/components/jog-target.js'
	import JogRow from '#lib/components/JogRow.svelte'
	import { Section, useSectionErrors } from '#lib/components/Section/index.js'
	import StatusLine from '#lib/components/StatusLine.svelte'
	import { untrack } from 'svelte'

	import { effectiveServoMax, resolveServoRange } from './servo-angle-limits'
	import { recordServoMove, useServoState } from './servo-state.svelte'

	interface Props {
		partID: string
		resourceName: string
		/**
		 * The lowest angle a step can reach. A host fills it from the servo config's `min_angle_deg`.
		 * Outside 0 to 360, or not below `maxDegrees`, it is ignored. @default 0
		 */
		minDegrees?: number
		/**
		 * The highest angle a step can reach. A host fills it from the servo config's
		 * `max_angle_deg`. Outside 0 to 360, or not above `minDegrees`, it is ignored. @default 180
		 */
		maxDegrees?: number
	}

	const { partID, resourceName, minDegrees, maxDegrees }: Props = $props()

	const POLL_INTERVAL_MS = 500
	const STEP_OPTIONS_DEGREES = [1, 5, 10, 15] as const
	const DEFAULT_STEP_DEGREES = 5
	const STEP_ITEMS = STEP_OPTIONS_DEGREES.map((step) => ({
		value: String(step),
		label: `${step}°`,
	}))

	const instanceId = $props.id()
	const stepLabelId = `${instanceId}-step`

	const client = createResourceClient(
		ServoClient,
		() => partID,
		() => resourceName
	)

	const positionQuery = createResourceQuery(client, 'getPosition', {
		refetchInterval: POLL_INTERVAL_MS,
	})
	const moveMutation = createResourceMutation(client, 'move')

	const sectionErrors = useSectionErrors(() => ({
		queries: [positionQuery],
		mutations: [moveMutation],
	}))

	const { motion, limits, commanded } = untrack(() => useServoState(partID, resourceName))

	// An effect, not $derived: the read that finds the servo at its commanded angle clears shared
	// state, so a later change the widgets did not command is stepped from the read position.
	$effect(() => {
		if (commanded.degrees !== undefined && positionQuery.data === commanded.degrees) {
			commanded.degrees = undefined
		}
	})

	let stepDegrees = $state<number>(DEFAULT_STEP_DEGREES)
	let movingTo = $state<number | undefined>()

	const range = $derived(resolveServoRange(minDegrees, maxDegrees))
	const lowest = $derived(range.min)
	const highest = $derived(effectiveServoMax(range, limits.userMaxDegrees))

	const statusText = $derived(movingTo === undefined ? '' : `Moving to ${movingTo}°`)

	const selectStep = (next: string | undefined) => {
		const selected = Number(next)
		const step = STEP_OPTIONS_DEGREES.find((option) => option === selected)
		if (step !== undefined) stepDegrees = step
	}

	const formatDegrees = String

	// One press sends one Move. A hold never repeats, so the release has nothing to do. A step
	// starts from the last commanded angle when there is one, so two quick presses make two steps.
	const press = async (direction: JogDirection) => {
		const start = commanded.degrees ?? positionQuery.data
		if (start === undefined) return
		const target = jogTarget({
			start,
			direction,
			step: stepDegrees,
			min: lowest,
			max: highest,
		})
		if (target === undefined) return
		const outcome = await motion.run(() => {
			movingTo = target
			return moveMutation.mutateAsync([target])
		})
		if (outcome === undefined) return
		movingTo = undefined
		recordServoMove(commanded, target, outcome)
	}

	const ignoreRelease = () => {}
</script>

{#snippet controls()}
	<Section.Body isLoading={sectionErrors.isLoading}>
		<div class="flex w-full min-w-0 flex-col gap-1">
			<JogRow
				label="Position"
				value={positionQuery.data}
				formatValue={formatDegrees}
				unit="°"
				step={stepDegrees}
				min={lowest}
				max={highest}
				isBusy={motion.isBusy}
				onPress={press}
				onRelease={ignoreRelease}
			/>
			<div class="flex items-center gap-2">
				<span
					id={stepLabelId}
					class="text-subtle-1 w-12 shrink-0 text-xs"
				>
					Step
				</span>
				<div class="w-20">
					<Select
						items={STEP_ITEMS}
						aria-labelledby={stepLabelId}
						bind:value={() => String(stepDegrees), selectStep}
					/>
				</div>
			</div>
			<StatusLine text={statusText} />
		</div>
	</Section.Body>
{/snippet}

<Section
	errorReporter={sectionErrors}
	class="grow flex-col gap-4"
>
	<Section.Heading>
		Quick move
		{#snippet aside()}
			<Section.Errors errors={sectionErrors.errors} />
		{/snippet}
	</Section.Heading>
	{@render controls()}
</Section>
