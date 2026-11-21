<!--
@component
The guarded SetPowerMode row in `BoardControls`: a Mode select and, for Offline deep, a warning and a
Duration. Offline deep arms before it sends. Status text goes to `onStatusChange` and a failed send to
the enclosing section's indicator.
-->
<script lang="ts">
	import { mdiAlert } from '@mdi/js'
	import { NumberField, Select } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'
	import { BoardClient, Duration, PowerMode } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ConfirmStep from '$lib/components/confirm-step.svelte'
	import { createInFlightGuard } from '$lib/components/in-flight-guard.svelte'
	import { useReportedError } from '$lib/components/media-frame/use-reported-error.svelte'

	import type { BoardPowerModeRowProps } from './board-control-row-props'

	const { partID, resourceName, onStatusChange }: BoardPowerModeRowProps = $props()

	const NORMAL_ITEM = 'normal'
	const OFFLINE_DEEP_ITEM = 'offline-deep'
	const NORMAL_LABEL = 'Normal'
	const OFFLINE_DEEP_LABEL = 'Offline deep'
	const MODE_ITEMS = [
		{ value: NORMAL_ITEM, label: NORMAL_LABEL },
		{ value: OFFLINE_DEEP_ITEM, label: OFFLINE_DEEP_LABEL },
	]
	const OFFLINE_DEEP_WARNING = 'The board may stop answering until it wakes.'
	const DURATION_HINT = 'Enter a duration of 0 seconds or more.'

	const id = $props.id()
	const modeLabelId = `${id}-mode`
	const durationHintId = `${id}-duration`

	let mode = $state(NORMAL_ITEM)
	let durationSeconds = $state<number | undefined>()
	let isArmed = $state(false)

	const isOfflineDeep = $derived(mode === OFFLINE_DEEP_ITEM)
	const modeLabel = $derived(isOfflineDeep ? OFFLINE_DEEP_LABEL : NORMAL_LABEL)
	// An empty duration sends none, and typing is not clamped, so a bad one holds back Execute.
	const isDurationValid = $derived(
		durationSeconds === undefined || (Number.isFinite(durationSeconds) && durationSeconds >= 0)
	)
	const isDurationHintShown = $derived(isOfflineDeep && !isDurationValid)
	const canExecute = $derived(!isOfflineDeep || isDurationValid)

	const client = createResourceClient(
		BoardClient,
		() => partID,
		() => resourceName
	)
	const setPowerModeMutation = createResourceMutation(client, 'setPowerMode')

	useReportedError(() => setPowerModeMutation.error)

	const guard = createInFlightGuard()

	// The whole seconds that are both sent and named in the armed status.
	const wholeSeconds = $derived(
		durationSeconds === undefined ? undefined : Math.floor(durationSeconds)
	)

	const buildArguments = (): Parameters<BoardClient['setPowerMode']> => {
		if (!isOfflineDeep) return [PowerMode.NORMAL]
		if (wholeSeconds === undefined) return [PowerMode.OFFLINE_DEEP]
		return [PowerMode.OFFLINE_DEEP, new Duration({ seconds: BigInt(wholeSeconds) })]
	}

	const send = () => guard.run(() => setPowerModeMutation.mutateAsync(buildArguments()))

	const setMode = (next: string | undefined) => {
		if (next !== undefined) mode = next
	}

	const armedStatus = () => {
		if (wholeSeconds === undefined) return 'Confirm to send Offline deep'
		return `Confirm to send Offline deep for ${wholeSeconds} s`
	}

	const statusFor = () => {
		if (guard.isBusy) return `Sending ${modeLabel}.`
		if (isArmed) return armedStatus()
		return ''
	}

	const statusText = $derived(statusFor())

	$effect(() => {
		onStatusChange(statusText)
	})
</script>

<div class="flex min-w-0 flex-col gap-2">
	<div class="flex flex-col gap-1">
		<span
			id={modeLabelId}
			class="text-subtle-1 text-xs"
		>
			Mode
		</span>
		<Select
			items={MODE_ITEMS}
			disabled={isArmed}
			bind:value={() => mode, setMode}
			aria-labelledby={modeLabelId}
		/>
	</div>
	{#if isOfflineDeep}
		<p class="text-warning-dark flex items-start gap-1 text-xs">
			<Icon
				icon={mdiAlert}
				size="sm"
			/>
			{OFFLINE_DEEP_WARNING}
		</p>
		<NumberField
			label="Duration"
			suffix="s"
			min={0}
			step={1}
			disabled={isArmed}
			state={isDurationValid ? undefined : 'error'}
			aria-describedby={isDurationHintShown ? durationHintId : undefined}
			bind:value={durationSeconds}
		/>
		{#if isDurationHintShown}
			<span
				id={durationHintId}
				class="text-subtle-1 text-xs">{DURATION_HINT}</span
			>
		{/if}
	{/if}
	<ConfirmStep
		label="Execute"
		confirmLabel="Confirm Offline deep"
		isConfirmRequired={isOfflineDeep}
		disabled={guard.isBusy || !canExecute}
		onconfirm={send}
		bind:isArmed
	/>
</div>
