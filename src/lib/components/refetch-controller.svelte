<script lang="ts">
	import type { QueryObserverResult } from '@tanstack/svelte-query'
	import type { PersistedState } from 'runed'

	import { mdiCheck, mdiPause, mdiRefresh } from '@mdi/js'
	import { Select } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'

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

	const selectOption = (selected: RefetchRate) => {
		selectedOption = selected
		const interval =
			RefetchRateToInterval.find(([rate]) => rate === selected)?.[1] ?? RefetchIntervals.ONE_SEC
		refetchInterval.current = interval
	}

	const getSelectedOption = () => selectedOption
	const pickOption = (next: string | undefined) => {
		const rate = RefetchRateToInterval.find(([candidate]) => candidate === next)?.[0]
		if (rate === undefined || rate === selectedOption) return
		selectOption(rate)
	}

	let refetchState = $state<'idle' | 'success' | 'refetching'>('idle')

	const manualIcon = $derived(refetchState === 'success' ? mdiCheck : mdiRefresh)

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

	const refetchItems = $derived(
		Object.values(RefetchRates)
			.filter((value) => allowLive || value !== RefetchRates.LIVE)
			.map((value) => ({ value, label: value }))
	)

	$effect(() => {
		return () => {
			globalThis.clearTimeout(stateNotifyTimeout)
		}
	})
</script>

<div class="text-default flex items-center gap-2 text-xs">
	<div class="max-w-50 min-w-0 flex-1">
		<Select
			items={refetchItems}
			bind:value={getSelectedOption, pickOption}
			aria-label="Refresh rate"
		/>
	</div>
	{#if selectedOption === RefetchRates.MANUAL}
		<button
			type="button"
			class="icon-button size-6"
			aria-label="Refresh"
			aria-busy={refetchState === 'refetching'}
			onclick={refetchQueries}
		>
			<Icon
				icon={manualIcon}
				size="sm"
			/>
		</button>
		<span
			class="sr-only"
			role="status"
		>
			{refetchState === 'refetching' ? 'Refetching' : ''}
		</span>
	{:else}
		<button
			type="button"
			class="icon-button size-6"
			aria-label="Pause"
			onclick={() => {
				selectOption(RefetchRates.MANUAL)
			}}
		>
			<Icon
				icon={mdiPause}
				size="sm"
			/>
		</button>
	{/if}
</div>
