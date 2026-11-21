<script
	lang="ts"
	module
>
	/** One field the Steps folder can show. */
	export type ArmStepField = 'position' | 'orientation' | 'joint' | 'straight-line'
</script>

<script lang="ts">
	import { Folder, NumberField } from '@viamrobotics/prime-controls'
	import { Checkbox, Field, Label } from '@viamrobotics/prime-ui'

	import type { ArmJogSteps } from './arm-jog-steps.svelte'

	interface Props {
		/** The step sizes this folder edits in place. */
		steps: ArmJogSteps
		/** The fields to show, in this order. */
		fields: readonly ArmStepField[]
	}

	const { steps, fields }: Props = $props()

	type StepSizeKey = 'positionMillimeters' | 'orientationDegrees' | 'jointDegrees'

	interface StepSizeField {
		label: string
		suffix: string
		min: number
		max: number
		key: StepSizeKey
	}

	const MIN_STEP = 1
	const MAX_POSITION_STEP_MILLIMETERS = 100
	const MAX_ANGLE_STEP_DEGREES = 45

	const STEP_SIZE_FIELDS: Record<Exclude<ArmStepField, 'straight-line'>, StepSizeField> = {
		position: {
			label: 'Position step',
			suffix: 'mm',
			min: MIN_STEP,
			max: MAX_POSITION_STEP_MILLIMETERS,
			key: 'positionMillimeters',
		},
		orientation: {
			label: 'Orientation step',
			suffix: '°',
			min: MIN_STEP,
			max: MAX_ANGLE_STEP_DEGREES,
			key: 'orientationDegrees',
		},
		joint: {
			label: 'Joint step',
			suffix: '°',
			min: MIN_STEP,
			max: MAX_ANGLE_STEP_DEGREES,
			key: 'jointDegrees',
		},
	}

	// A value outside the field's range is left unwritten, so a step always stays usable.
	const setStepSize = (field: StepSizeField, next: number | undefined) => {
		if (next === undefined || !Number.isFinite(next) || next < field.min || next > field.max) {
			return
		}
		steps[field.key] = next
	}
</script>

<Folder
	title="Steps"
	open={false}
>
	<div class="flex flex-col gap-2">
		{#each fields as field (field)}
			{#if field === 'straight-line'}
				<Field class="flex items-center gap-2">
					<Checkbox
						bind:checked={
							() => steps.isStraightLine,
							(checked) => {
								steps.isStraightLine = checked
							}
						}
					/>
					<Label>Move in a straight line</Label>
				</Field>
			{:else}
				{@const stepSize = STEP_SIZE_FIELDS[field]}
				<NumberField
					label={stepSize.label}
					suffix={stepSize.suffix}
					min={stepSize.min}
					max={stepSize.max}
					bind:value={
						() => steps[stepSize.key],
						(next) => {
							setStepSize(stepSize, next)
						}
					}
				/>
			{/if}
		{/each}
	</div>
</Folder>
