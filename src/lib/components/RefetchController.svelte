<script lang="ts">
	import type { QueryObserverResult } from '@tanstack/svelte-query'
	import type { PersistedState } from 'runed'

	import { IconButton, Select } from '@viamrobotics/prime-core'

	import {
		type RefetchInterval,
		RefetchIntervals,
		type RefetchRate,
		RefetchRates,
		RefetchRateToInterval,
	} from './refetch-interval-store.svelte.ts'

	interface Props {
		refetchInterval: PersistedState<RefetchInterval>
		queries: QueryObserverResult[]
		refetchNotifyDurationMs?: number
		allowLive?: boolean
	}

	const {
		refetchInterval,
		queries,
		refetchNotifyDurationMs = 500,
		allowLive = false,
	}: Props = $props()

	let selectedOption = $derived(
		RefetchRateToInterval.find(([, interval]) => interval === refetchInterval.current)?.[0] ??
			RefetchRates.ONE_SEC
	)

	const selectOption = (selected: string) => {
		selectedOption = selected as RefetchRate
		const interval =
			RefetchRateToInterval.find(([rate]) => rate === selectedOption)?.[1] ??
			RefetchIntervals.ONE_SEC
		refetchInterval.current = interval
	}

	let refetchState = $state<'idle' | 'success' | 'refetching'>('idle')
	const manualIconState = $derived(
		{
			idle: { name: 'refresh' as const },
			success: { name: 'check' as const },
			refetching: { progress: 'indeterminate' as const },
		}[refetchState]
	)

	let refetchingStateTimeout: number | undefined

	const refetchQueries = async () => {
		// Clear the timeout to prevent races if refetchQueries is called during a refetch
		window.clearTimeout(refetchingStateTimeout)

		// This is in a timeout to prevent icon-flashing on very quick queries
		refetchingStateTimeout = window.setTimeout(() => {
			refetchState = 'refetching'
		}, 250)
		const refetchCalls = queries.map(async (query) => query.refetch())
		await Promise.all(refetchCalls)
		clearTimeout(refetchingStateTimeout)
		refetchState = 'success'
		resetToIdleEventually()
	}

	let stateNotifyTimeout: number | undefined

	const resetToIdleEventually = () => {
		window.clearTimeout(stateNotifyTimeout)
		stateNotifyTimeout = window.setTimeout(() => {
			refetchState = 'idle'
		}, refetchNotifyDurationMs)
	}

	const onChange = (event: Event) => {
		selectOption((event.target as HTMLSelectElement).value)
	}

	const refetchOptions = $derived(
		allowLive
			? Object.values(RefetchRates)
			: Object.values(RefetchRates).filter((value) => value !== RefetchRates.LIVE)
	)

	$effect(() => {
		return () => {
			globalThis.clearTimeout(stateNotifyTimeout)
		}
	})
</script>

<div class="text-default flex text-xs">
	<div class="w-50 max-w-full">
		<Select
			on:change={onChange}
			cx="border-r-0"
		>
			{#each refetchOptions as option (option)}
				<option selected={selectedOption === option}>{option}</option>
			{/each}
		</Select>
	</div>
	{#if selectedOption === RefetchRates.MANUAL}
		<IconButton
			icon={manualIconState.name ?? 'refresh'}
			progress={'progress' in manualIconState ? 'indeterminate' : undefined}
			label="refetch"
			variant="secondary"
			cx="border-light border"
			on:click={refetchQueries}
		/>
	{:else}
		<IconButton
			icon="pause"
			label="pause"
			variant="secondary"
			cx="border-light border"
			on:click={() => {
				selectOption(RefetchRates.MANUAL)
			}}
		/>
	{/if}
</div>
