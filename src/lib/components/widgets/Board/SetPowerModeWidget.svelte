<script lang="ts">
	import { mdiAlert, mdiPlayCircleOutline } from '@mdi/js'
	import { NumberField, Select } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'
	import { BoardClient, Duration, PowerMode } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { emptyOnClear } from '#lib/components/empty-on-clear.js'
	import HeldBack from '#lib/components/HeldBack.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'
	import { untrack } from 'svelte'

	import { useBoardState } from './board-state.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const UNSPECIFIED_ITEM = 'unspecified'
	const NORMAL_ITEM = 'normal'
	const OFFLINE_DEEP_ITEM = 'offline-deep'
	const MODE_ITEMS = [
		{ value: UNSPECIFIED_ITEM, label: 'Unspecified' },
		{ value: NORMAL_ITEM, label: 'Normal' },
		{ value: OFFLINE_DEEP_ITEM, label: 'Offline deep' },
	]
	const POWER_MODE_BY_ITEM = new Map([
		[UNSPECIFIED_ITEM, PowerMode.UNSPECIFIED],
		[NORMAL_ITEM, PowerMode.NORMAL],
		[OFFLINE_DEEP_ITEM, PowerMode.OFFLINE_DEEP],
	])
	const NANOS_PER_SECOND = 1_000_000_000
	const OFFLINE_DEEP_WARNING = 'The board may stop answering until it wakes.'
	const DURATION_HINT = 'Enter a duration of 0 seconds or more.'

	let mode = $state(NORMAL_ITEM)
	let durationSeconds = $state<number | undefined>()

	const labelId = $props.id()
	const durationHintId = `${labelId}-duration`

	const isOfflineDeep = $derived(mode === OFFLINE_DEEP_ITEM)
	// An empty duration sends none, and typing is not clamped, so a bad one holds back Execute.
	const isDurationValid = $derived(
		durationSeconds === undefined || (Number.isFinite(durationSeconds) && durationSeconds >= 0)
	)
	const blockedReason = $derived(isDurationValid ? undefined : DURATION_HINT)
	const BUSY_REASON = 'Wait for the power mode call in flight to finish.'

	const client = createResourceClient(
		BoardClient,
		() => partID,
		() => resourceName
	)

	const setPowerModeMutation = createResourceMutation(client, 'setPowerMode')
	const { powerMode: powerModeGuard } = untrack(() => useBoardState(partID, resourceName))
	const executeBlockedReason = $derived(
		blockedReason ?? (powerModeGuard.isBusy ? BUSY_REASON : undefined)
	)

	const buildArguments = (): Parameters<BoardClient['setPowerMode']> => {
		const powerMode = POWER_MODE_BY_ITEM.get(mode) ?? PowerMode.UNSPECIFIED
		if (durationSeconds === undefined) return [powerMode]
		const totalNanos = Math.round(durationSeconds * NANOS_PER_SECOND)
		const wholeSeconds = Math.floor(totalNanos / NANOS_PER_SECOND)
		const nanos = totalNanos - wholeSeconds * NANOS_PER_SECOND
		return [powerMode, new Duration({ seconds: BigInt(wholeSeconds), nanos })]
	}

	const setMode = (next: string | undefined) => {
		if (next !== undefined) mode = next
	}

	const execute = () => {
		if (executeBlockedReason !== undefined) return
		const powerModeArguments = buildArguments()
		void powerModeGuard.run(() => setPowerModeMutation.mutateAsync(powerModeArguments))
	}
</script>

<ApiSection
	method="SetPowerMode"
	api={ResourceTriplets.Board}
	class="grow flex-col gap-2"
	mutations={[setPowerModeMutation]}
>
	<div class="flex flex-col gap-1">
		<span
			id={labelId}
			class="text-subtle-1 text-xs"
		>
			Power mode
		</span>
		<Select
			items={MODE_ITEMS}
			bind:value={() => mode, setMode}
			aria-labelledby={labelId}
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
	{/if}
	<NumberField
		label="Duration"
		suffix="s"
		min={0}
		state={isDurationValid ? undefined : 'error'}
		aria-describedby={blockedReason === undefined ? undefined : durationHintId}
		{...emptyOnClear(() => (durationSeconds = undefined))}
		bind:value={durationSeconds}
	/>
	<div class="flex justify-end">
		<HeldBack
			reason={executeBlockedReason}
			reasonId={blockedReason === undefined ? undefined : durationHintId}
		>
			{#snippet children(heldBack)}
				<button
					type="button"
					class="button button-compact"
					{...heldBack}
					onclick={execute}
				>
					<Icon icon={mdiPlayCircleOutline} />
					Execute
				</button>
			{/snippet}
		</HeldBack>
	</div>
	{#if blockedReason !== undefined}
		<span
			id={durationHintId}
			class="text-subtle-1 text-xs">{blockedReason}</span
		>
	{/if}
</ApiSection>
