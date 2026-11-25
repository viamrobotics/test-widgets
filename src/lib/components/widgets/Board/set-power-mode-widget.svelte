<script lang="ts">
	import { mdiAlert, mdiPlayCircleOutline } from '@mdi/js'
	import { NumberField, Select } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'
	import { BoardClient, Duration, PowerMode } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import { untrack } from 'svelte'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import { useBoardState } from './board-state.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const NORMAL_ITEM = 'normal'
	const OFFLINE_DEEP_ITEM = 'offline-deep'
	const MODE_ITEMS = [
		{ value: NORMAL_ITEM, label: 'Normal' },
		{ value: OFFLINE_DEEP_ITEM, label: 'Offline deep' },
	]
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
	const canExecute = $derived(!isOfflineDeep || isDurationValid)
	const isDurationHintShown = $derived(isOfflineDeep && !isDurationValid)

	const client = createResourceClient(
		BoardClient,
		() => partID,
		() => resourceName
	)

	const setPowerModeMutation = createResourceMutation(client, 'setPowerMode')
	const { powerMode: powerModeGuard } = untrack(() => useBoardState(partID, resourceName))

	const buildArguments = (): Parameters<BoardClient['setPowerMode']> => {
		if (!isOfflineDeep) return [PowerMode.NORMAL]
		if (durationSeconds === undefined) return [PowerMode.OFFLINE_DEEP]
		return [PowerMode.OFFLINE_DEEP, new Duration({ seconds: BigInt(Math.floor(durationSeconds)) })]
	}

	const setMode = (next: string | undefined) => {
		if (next !== undefined) mode = next
	}

	const execute = () => {
		if (!canExecute) return
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
		<NumberField
			label="Duration"
			suffix="s"
			min={0}
			step={1}
			state={isDurationValid ? undefined : 'error'}
			aria-describedby={isDurationHintShown ? durationHintId : undefined}
			bind:value={durationSeconds}
		/>
		{#if !isDurationValid}
			<span
				id={durationHintId}
				class="text-subtle-1 text-xs">{DURATION_HINT}</span
			>
		{/if}
	{/if}
	<div class="flex justify-end">
		<button
			type="button"
			class="button button-compact"
			disabled={!canExecute || powerModeGuard.isBusy}
			aria-describedby={isDurationHintShown ? durationHintId : undefined}
			onclick={execute}
		>
			<Icon icon={mdiPlayCircleOutline} />
			Execute
		</button>
	</div>
</ApiSection>
