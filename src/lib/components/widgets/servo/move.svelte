<script lang="ts">
	import { mdiBackupRestore, mdiPlayCircleOutline } from '@mdi/js'
	import { NumberField } from '@viamrobotics/prime-controls'
	import { type FieldState, Icon, Tooltip } from '@viamrobotics/prime-ui'

	interface Props {
		currentPosition: number
		moveTo: (angle: number) => void
	}

	const NEGATIVE_MESSAGE = 'Desired angle must be non-negative'

	const { currentPosition, moveTo }: Props = $props()

	// Until the user edits, the field follows the live position. An emptied field is held as NaN,
	// so it stays empty while typing and Execute waits.
	let edited = $state<number | undefined>()

	const desiredAngle = $derived(edited ?? currentPosition)
	const isEdited = $derived(edited !== undefined)
	const isNegative = $derived(desiredAngle < 0)
	const isValid = $derived(Number.isFinite(desiredAngle) && !isNegative)
	const message = $derived(isNegative ? NEGATIVE_MESSAGE : undefined)

	const fieldState = $derived.by((): FieldState | undefined => {
		if (Number.isNaN(desiredAngle) || isNegative) return 'error'
		return undefined
	})

	const current = $derived(`${currentPosition}°`)

	const getField = () => (Number.isNaN(desiredAngle) ? undefined : desiredAngle)
	const setField = (value: number | undefined) => {
		edited = value !== undefined && Number.isFinite(value) ? value : Number.NaN
	}
</script>

<div class="flex min-w-0 flex-col gap-1">
	<div class="flex flex-wrap items-end gap-2">
		<div class="min-w-40 flex-1">
			<Tooltip disabled={message === undefined}>
				<Tooltip.Trigger class="block min-w-0">
					<NumberField
						label="Desired angle"
						hint="Accepts angles between 0-180 degrees"
						suffix="°"
						step={1}
						min={0}
						state={fieldState}
						bind:value={getField, setField}
					/>
				</Tooltip.Trigger>
				<Tooltip.Content class="max-w-72">{message}</Tooltip.Content>
			</Tooltip>
			{#if message !== undefined}
				<!-- The tooltip is not in the page until it opens, so screen readers get the message here. -->
				<span class="sr-only">{message}</span>
			{/if}
		</div>
		<button
			type="button"
			class="button button-compact ml-auto"
			disabled={!isValid}
			onclick={() => {
				moveTo(desiredAngle)
			}}
		>
			<Icon
				icon={mdiPlayCircleOutline}
				size="sm"
			/>
			Execute
		</button>
	</div>
	<div class="flex justify-end">
		<button
			type="button"
			class="button button-ghost button-xs font-roboto-mono"
			aria-label="Reset desired angle to its current value, {current}"
			disabled={!isEdited}
			onclick={() => {
				edited = undefined
			}}
		>
			<Icon
				icon={mdiBackupRestore}
				size="sm"
			/>
			{current}
		</button>
	</div>
</div>
