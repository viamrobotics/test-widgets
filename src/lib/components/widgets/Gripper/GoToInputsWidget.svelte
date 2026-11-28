<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { NumberField } from '@viamrobotics/prime-controls'
	import { type FieldState, FieldStates, Icon, Tooltip } from '@viamrobotics/prime-ui'
	import { GripperClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { emptyOnClear } from '#lib/components/empty-on-clear.js'
	import ResetToCurrentButton from '#lib/components/ResetToCurrentButton.svelte'
	import { formatNumeric } from '#lib/format.js'
	import { ResourceTriplets } from '#lib/resource-triplet.js'
	import { untrack } from 'svelte'

	import { useEditedTargets } from '../Arm/use-edited-targets.svelte'
	import { useGripperState } from './gripper-state.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const INPUT_DRIFT_THRESHOLD = 0.01
	const INPUT_STEP = 0.01
	const MISSING_VALUE = '-'

	const client = createResourceClient(
		GripperClient,
		() => partID,
		() => resourceName
	)

	const currentInputsQuery = createResourceQuery(client, 'getCurrentInputs', {
		refetchInterval: 500,
	})
	const goToInputsMutation = createResourceMutation(client, 'goToInputs')
	const { motion } = untrack(() => useGripperState(partID, resourceName))

	const currentInputs = $derived(currentInputsQuery.data ?? [])

	const targets = useEditedTargets<number>(
		(index) => currentInputs[index] ?? 0,
		() => INPUT_DRIFT_THRESHOLD
	)

	const desiredInputs = $derived(currentInputs.map((_, index) => targets.target(index)))
	const invalidInputIndex = $derived(desiredInputs.findIndex((value) => !Number.isFinite(value)))
	const hasInvalidInput = $derived(invalidInputIndex !== -1)
	const blockedReason = $derived(
		hasInvalidInput ? `Enter a value for Input ${invalidInputIndex} to execute.` : undefined
	)
	const hintId = $props.id()

	interface StatusIndicator {
		state: FieldState
		message: string
	}

	const driftIndicator = (index: number): StatusIndicator | undefined => {
		const drift = targets.drift(index)
		if (drift === undefined) return undefined
		return {
			state: FieldStates.Warn,
			message: `Gripper moved ${formatNumeric(drift)} since you edited Input ${index}.`,
		}
	}

	const fieldState = (index: number, indicator: StatusIndicator | undefined) =>
		index === invalidInputIndex ? FieldStates.Error : indicator?.state

	const fieldDescribedBy = (index: number, indicator: StatusIndicator | undefined) => {
		if (index === invalidInputIndex) return hintId
		return indicator ? `${hintId}-drift-${index}` : undefined
	}

	const execute = () => {
		if (hasInvalidInput || motion.isBusy) return
		void motion.run(() => goToInputsMutation.mutateAsync([desiredInputs]))
	}
</script>

<ApiSection
	method="GoToInputs"
	api={ResourceTriplets.Gripper}
	queries={[currentInputsQuery]}
	mutations={[goToInputsMutation]}
	class="min-w-0 grow flex-col gap-4"
>
	{#if currentInputs.length > 0}
		<div class="flex flex-col gap-2">
			{#each currentInputs as liveValue, index (index)}
				{@const indicator = driftIndicator(index)}
				{@const currentText = formatNumeric(liveValue)}
				<div class="flex flex-col gap-1">
					<Tooltip disabled={!indicator}>
						<Tooltip.Trigger class="block min-w-0">
							<NumberField
								label="Input {index}"
								step={INPUT_STEP}
								state={fieldState(index, indicator)}
								aria-describedby={fieldDescribedBy(index, indicator)}
								{...emptyOnClear(() => {
									targets.edit(index, Number.NaN)
								})}
								bind:value={
									() => targets.target(index),
									(next) => {
										targets.edit(index, next ?? Number.NaN)
									}
								}
							>
								{#snippet trailing()}
									<ResetToCurrentButton
										label="Input {index}"
										current={currentText}
										isEdited={targets.isEdited(index)}
										onreset={() => {
											targets.reset(index)
										}}
									/>
								{/snippet}
							</NumberField>
						</Tooltip.Trigger>
						<Tooltip.Content class="max-w-72">{indicator?.message}</Tooltip.Content>
					</Tooltip>
					{#if indicator}
						<!-- The tooltip is not in the page until it opens, so screen readers get the message here. -->
						<span
							id="{hintId}-drift-{index}"
							class="sr-only">{indicator.message}</span
						>
					{/if}
				</div>
			{/each}
		</div>
		<div class="flex flex-col items-end gap-1">
			<Tooltip disabled={blockedReason === undefined}>
				<Tooltip.Trigger>
					<!-- aria-disabled, not disabled: the button stays focusable, so the tooltip can say why. -->
					<button
						type="button"
						class="button button-compact"
						aria-disabled={hasInvalidInput || motion.isBusy || undefined}
						aria-describedby={blockedReason === undefined ? undefined : hintId}
						onclick={execute}
					>
						<Icon icon={mdiPlayCircleOutline} />
						Execute
					</button>
				</Tooltip.Trigger>
				<Tooltip.Content class="max-w-72">{blockedReason}</Tooltip.Content>
			</Tooltip>
			{#if blockedReason !== undefined}
				<span
					id={hintId}
					class="sr-only">{blockedReason}</span
				>
			{/if}
		</div>
	{:else}
		<div
			role="group"
			aria-labelledby="{hintId}-empty"
			class="flex min-w-0 items-center gap-2"
		>
			<span
				id="{hintId}-empty"
				class="text-subtle-1 w-14 shrink-0 text-xs">Inputs</span
			>
			<span class="readout font-roboto-mono">
				<span class="readout-value">{MISSING_VALUE}</span>
			</span>
		</div>
	{/if}
</ApiSection>
