<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { NumberField } from '@viamrobotics/prime-controls'
	import { type FieldState, Icon, Tooltip } from '@viamrobotics/prime-ui'
	import { emptyOnClear } from '#lib/components/empty-on-clear.js'
	import ResetToCurrentButton from '#lib/components/ResetToCurrentButton.svelte'

	interface Props {
		currentPosition: number
		/** The lowest angle Execute sends. */
		min: number
		/** The highest angle Execute sends. */
		max: number
		moveTo: (angle: number) => void
		/**
		 * True while another servo move is in flight, which holds back Execute. Execute is also held
		 * back, with the reason in a tooltip, while the angle is empty, outside `min` to `max`, or not a whole number.
		 */
		isBusy: boolean
	}

	const EMPTY_MESSAGE = 'Enter a desired angle'
	const NEGATIVE_MESSAGE = 'Desired angle must be non-negative'
	// The Servo API takes a whole number of degrees.
	const FRACTION_MESSAGE = 'Desired angle must be a whole number of degrees'

	const { currentPosition, min, max, moveTo, isBusy }: Props = $props()

	// Until the user edits, the field follows the live position. An emptied field is held as NaN,
	// so it stays empty while typing and Execute waits.
	let edited = $state<number | undefined>()

	const desiredAngle = $derived(edited ?? currentPosition)
	const isEdited = $derived(edited !== undefined)
	const isEmpty = $derived(Number.isNaN(desiredAngle))

	const blockedReason = $derived.by(() => {
		if (isEmpty) return EMPTY_MESSAGE
		if (desiredAngle < 0) return NEGATIVE_MESSAGE
		if (desiredAngle < min || desiredAngle > max) {
			return `Desired angle must be between ${min}° and ${max}°`
		}
		if (!Number.isInteger(desiredAngle)) return FRACTION_MESSAGE
		return undefined
	})
	// An emptied field is mid-edit, so the field's own tooltip stays quiet until a value is wrong.
	const fieldMessage = $derived(isEmpty ? undefined : blockedReason)
	const isExecuteDisabled = $derived(blockedReason !== undefined || isBusy)

	const fieldState = $derived<FieldState | undefined>(
		blockedReason === undefined ? undefined : 'error'
	)

	const blockedReasonId = $props.id()

	const execute = () => {
		if (isExecuteDisabled) return
		moveTo(desiredAngle)
	}

	const current = $derived(`${currentPosition}°`)

	const getField = () => (Number.isNaN(desiredAngle) ? undefined : desiredAngle)
	const setField = (value: number | undefined) => {
		edited = value !== undefined && Number.isFinite(value) ? value : Number.NaN
	}
</script>

<div class="flex min-w-0 flex-col gap-1">
	<div class="flex flex-wrap items-end gap-2">
		<div class="min-w-40 flex-1">
			<Tooltip disabled={fieldMessage === undefined}>
				<Tooltip.Trigger class="block min-w-0">
					<NumberField
						label="Desired angle"
						hint="Accepts angles between {min}-{max} degrees"
						suffix="°"
						step={1}
						{min}
						state={fieldState}
						{...emptyOnClear(() => setField(undefined))}
						bind:value={getField, setField}
					>
						{#snippet trailing()}
							<ResetToCurrentButton
								label="desired angle"
								{current}
								{isEdited}
								onreset={() => {
									edited = undefined
								}}
							/>
						{/snippet}
					</NumberField>
				</Tooltip.Trigger>
				<Tooltip.Content class="max-w-72">{fieldMessage}</Tooltip.Content>
			</Tooltip>
			{#if blockedReason !== undefined}
				<!-- A tooltip is not in the page until it opens, so screen readers get the reason here. -->
				<span
					id={blockedReasonId}
					class="sr-only"
				>
					{blockedReason}
				</span>
			{/if}
		</div>
		<Tooltip disabled={blockedReason === undefined}>
			<Tooltip.Trigger class="ml-auto">
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
	</div>
</div>
