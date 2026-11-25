<script lang="ts">
	import { Select } from '@viamrobotics/prime-controls'
	import { ServoClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'
	import { untrack } from 'svelte'

	import type { JogDirection } from '$lib/components/jog-target'

	import JogRow from '$lib/components/jog-row.svelte'
	import { jogTarget } from '$lib/components/jog-target'
	import { Section, useSectionErrors } from '$lib/components/section'
	import StatusLine from '$lib/components/status-line.svelte'

	import { effectiveServoMax, resolveServoRange } from './servo-angle-limits'
	import { useServoState } from './servo-state.svelte'

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

	const { motion, limits } = untrack(() => useServoState(partID, resourceName))

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

	// One press sends one Move. A hold never repeats, so the release has nothing to do.
	const press = async (direction: JogDirection) => {
		if (positionQuery.data === undefined) return
		const target = jogTarget({
			start: positionQuery.data,
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
