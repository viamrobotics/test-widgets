<script lang="ts">
	import { mdiInformationOutline, mdiPlayCircleOutline } from '@mdi/js'
	import { NumberField } from '@viamrobotics/prime-controls'
	import { type FieldState, Icon, Tooltip } from '@viamrobotics/prime-ui'
	import { emptyOnClear } from '#lib/components/empty-on-clear.js'
	import ResetToCurrentButton from '#lib/components/ResetToCurrentButton.svelte'
	import { formatNumeric } from '#lib/format.js'
	import { SvelteMap } from 'svelte/reactivity'

	import { useEditedTargets } from '../Arm/use-edited-targets.svelte'

	interface Props {
		positions: number[]
		moveTo: (newPos: number[], speeds: number[]) => void
		/**
		 * True while another motion call is in flight, which holds back Execute. Execute is also held
		 * back, with the reason in a tooltip, while a position is empty or a speed is empty or not above 0.
		 * @default false
		 */
		isBusy?: boolean
	}

	const DEFAULT_SPEED = 50
	// Tight enough to catch a real move, loose enough to ignore encoder noise.
	const DRIFT_THRESHOLD_MM = 1

	const { positions, moveTo, isBusy = false }: Props = $props()

	const editedSpeeds = new SvelteMap<number, number>()
	const desiredSpeeds = $derived(
		positions.map((_, index) => editedSpeeds.get(index) ?? DEFAULT_SPEED)
	)

	const targets = useEditedTargets<number>(
		(index) => positions[index] ?? 0,
		() => DRIFT_THRESHOLD_MM
	)
	const desiredPositions = $derived(positions.map((_, index) => targets.target(index)))

	const driftMessage = (index: number) => {
		const drift = targets.drift(index)
		return drift === undefined
			? undefined
			: `Gantry moved ${formatNumeric(drift)} mm since you edited axis ${index}.`
	}

	// An emptied field is held as NaN, so the field stays empty while typing and Execute waits.
	const fromField = (value: number | undefined) =>
		value !== undefined && Number.isFinite(value) ? value : Number.NaN
	const toField = (value: number | undefined) =>
		value === undefined || Number.isNaN(value) ? undefined : value

	// The gantry rejects a speed of 0 or below, so the form holds it back before it is sent.
	const isSpeedInvalid = (speed: number | undefined) =>
		speed === undefined || Number.isNaN(speed) || speed <= 0

	const blockedReason = $derived.by(() => {
		if (desiredPositions.some((value) => Number.isNaN(value))) {
			return 'Enter a position for every axis.'
		}
		if (desiredSpeeds.some((value) => isSpeedInvalid(value))) {
			return 'Enter a speed above 0 mm/s for every axis.'
		}
		return undefined
	})
	const isExecuteDisabled = $derived(blockedReason !== undefined || isBusy)

	const execute = () => {
		if (isExecuteDisabled) {
			return
		}
		moveTo(desiredPositions, desiredSpeeds)
	}

	const positionState = (index: number): FieldState | undefined => {
		if (Number.isNaN(desiredPositions[index])) return 'error'
		if (driftMessage(index) !== undefined) return 'warn'
		return undefined
	}

	const setPosition = (index: number, value: number | undefined) => {
		targets.edit(index, fromField(value))
	}

	const setSpeed = (index: number, value: number | undefined) => {
		editedSpeeds.set(index, fromField(value))
	}

	const resetToZero = () => {
		editedSpeeds.clear()
		for (const index of positions.keys()) {
			targets.edit(index, 0)
		}
	}

	const instanceId = $props.id()
	const blockedReasonId = `${instanceId}-blocked-reason`
</script>

<div class="@container flex min-w-0 flex-col gap-3">
	<div class="flex flex-col gap-3">
		{#each [...positions.keys()] as index (index)}
			{@const message = driftMessage(index)}
			{@const current = `${formatNumeric(positions[index])} mm`}
			{@const axisLabelId = `${instanceId}-axis-${index}`}
			<div
				role="group"
				aria-labelledby={axisLabelId}
				class="flex flex-col gap-1"
			>
				<span
					id={axisLabelId}
					class="text-subtle-1 text-xs"
				>
					Axis {index}
				</span>
				<div class="grid grid-cols-1 gap-2 @[317px]:grid-cols-2">
					<div class="flex min-w-0 flex-col gap-1">
						<Tooltip disabled={message === undefined}>
							<Tooltip.Trigger class="block min-w-0">
								<NumberField
									label="Position"
									suffix="mm"
									step={0.01}
									state={positionState(index)}
									{...emptyOnClear(() => setPosition(index, undefined))}
									bind:value={
										() => toField(desiredPositions[index]), (value) => setPosition(index, value)
									}
								>
									{#snippet trailing()}
										<ResetToCurrentButton
											label="Axis {index} position"
											{current}
											isEdited={targets.isEdited(index)}
											onreset={() => {
												targets.reset(index)
											}}
										/>
									{/snippet}
								</NumberField>
							</Tooltip.Trigger>
							<Tooltip.Content class="max-w-72">{message}</Tooltip.Content>
						</Tooltip>
						{#if message !== undefined}
							<!-- The tooltip is not in the page until it opens, so screen readers get the message here. -->
							<span class="sr-only">{message}</span>
						{/if}
					</div>
					<div class="min-w-0 self-start">
						<NumberField
							label="Speed"
							suffix="mm/s"
							step={0.1}
							state={isSpeedInvalid(desiredSpeeds[index]) ? 'error' : undefined}
							{...emptyOnClear(() => setSpeed(index, undefined))}
							bind:value={() => toField(desiredSpeeds[index]), (value) => setSpeed(index, value)}
						/>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<div class="flex flex-col gap-1">
		<div class="flex items-center gap-1">
			<span
				id={instanceId}
				class="text-subtle-1 text-xs"
			>
				Quick set
			</span>
			<Tooltip>
				<Tooltip.Trigger>
					<button
						type="button"
						class="icon-button size-6"
						aria-label="About Quick set"
					>
						<Icon
							icon={mdiInformationOutline}
							size="sm"
						/>
					</button>
				</Tooltip.Trigger>
				<Tooltip.Content>Will update the Position inputs but will not execute</Tooltip.Content>
			</Tooltip>
		</div>
		<div
			role="group"
			aria-labelledby={instanceId}
			class="flex flex-wrap gap-2"
		>
			<button
				type="button"
				class="button button-compact"
				onclick={resetToZero}
			>
				Zero
			</button>
			<button
				type="button"
				class="button button-compact"
				onclick={() => {
					targets.resetAll()
				}}
			>
				Current position
			</button>
		</div>
	</div>

	<div class="flex justify-end">
		<Tooltip disabled={blockedReason === undefined}>
			<Tooltip.Trigger>
				<!-- aria-disabled, not disabled: the button stays focusable, so the tooltip can say why. -->
				<button
					type="button"
					class="button button-compact"
					aria-disabled={isExecuteDisabled || undefined}
					aria-describedby={blockedReason === undefined ? undefined : blockedReasonId}
					onclick={execute}
				>
					<Icon
						icon={mdiPlayCircleOutline}
						size="sm"
					/>
					Execute
				</button>
			</Tooltip.Trigger>
			<Tooltip.Content class="max-w-72">{blockedReason}</Tooltip.Content>
		</Tooltip>
		{#if blockedReason !== undefined}
			<span
				id={blockedReasonId}
				class="sr-only"
			>
				{blockedReason}
			</span>
		{/if}
	</div>
</div>
