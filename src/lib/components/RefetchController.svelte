<script lang="ts">
	import type { QueryObserverResult } from '@tanstack/svelte-query'
	import type { PersistedState } from 'runed'

	import { mdiCheck, mdiPause, mdiPlay, mdiRefresh } from '@mdi/js'
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

	const REFETCHING_NOTICE_DELAY_MS = 250
	const rateLabelId = $props.id()

	const isPaused = $derived(refetchInterval.current === RefetchIntervals.MANUAL)

	// The rate Resume returns to. A reload while paused forgets it, so it starts at the default.
	let resumeInterval: RefetchInterval = RefetchIntervals.ONE_SEC

	const rateItems = $derived(
		Object.values(RefetchRates)
			.filter((rate) => rate !== RefetchRates.MANUAL)
			.filter((rate) => allowLive || rate !== RefetchRates.LIVE)
			.map((rate) => ({ value: rate, label: rate }))
	)

	const rateOf = (interval: RefetchInterval): RefetchRate | undefined =>
		RefetchRateToInterval.find(([, candidate]) => candidate === interval)?.[0]

	const offeredRate = $derived.by(() => {
		const rate = rateOf(refetchInterval.current)
		return rateItems.some((item) => item.value === rate) ? rate : undefined
	})
	const selectedRate = $derived(offeredRate ?? RefetchRates.ONE_SEC)

	// A stored rate this control does not offer, such as live, would poll at a rate the picker cannot show.
	$effect(() => {
		if (!isPaused && offeredRate === undefined) refetchInterval.current = RefetchIntervals.ONE_SEC
	})

	const getSelectedRate = () => selectedRate
	const pickRate = (next: string | undefined) => {
		const interval = RefetchRateToInterval.find(([rate]) => rate === next)?.[1]
		if (interval === undefined || interval === RefetchIntervals.MANUAL) return
		refetchInterval.current = interval
	}

	let refetchState = $state<'idle' | 'success' | 'refetching'>('idle')

	// Read by a screen reader only. The visible "Paused" and "Updates" text is not a live region.
	let announcement = $state('')

	const togglePause = () => {
		if (isPaused) {
			refetchInterval.current = resumeInterval
			announcement = 'Updates resumed'
			return
		}
		resumeInterval = refetchInterval.current
		refetchInterval.current = RefetchIntervals.MANUAL
		announcement = 'Updates paused'
	}

	let refetchesInFlight = 0
	let isDestroyed = false
	let refetchingNoticeTimeout: number | undefined
	let idleTimeout: number | undefined

	const refetchQueries = async () => {
		refetchesInFlight += 1
		window.clearTimeout(refetchingNoticeTimeout)
		window.clearTimeout(idleTimeout)
		// Delayed, so a quick refetch does not flash the status.
		refetchingNoticeTimeout = window.setTimeout(() => {
			refetchState = 'refetching'
			announcement = 'Refreshing'
		}, REFETCHING_NOTICE_DELAY_MS)
		await Promise.all(queries.map(async (query) => query.refetch()))
		refetchesInFlight -= 1
		if (refetchesInFlight > 0 || isDestroyed) return
		window.clearTimeout(refetchingNoticeTimeout)
		refetchState = 'success'
		announcement = 'Refreshed'
		idleTimeout = window.setTimeout(() => {
			refetchState = 'idle'
		}, refetchNotifyDurationMs)
	}

	$effect(() => {
		return () => {
			isDestroyed = true
			window.clearTimeout(refetchingNoticeTimeout)
			window.clearTimeout(idleTimeout)
		}
	})
</script>

<div class="text-default flex min-w-0 items-center gap-2 text-xs">
	<button
		type="button"
		class="icon-button size-6"
		aria-label={isPaused ? 'Resume' : 'Pause'}
		onclick={togglePause}
	>
		<Icon
			icon={isPaused ? mdiPlay : mdiPause}
			size="sm"
		/>
	</button>
	{#if isPaused}
		<button
			type="button"
			class="icon-button size-6"
			aria-label="Refresh"
			onclick={refetchQueries}
		>
			<Icon
				icon={refetchState === 'success' ? mdiCheck : mdiRefresh}
				size="sm"
			/>
		</button>
		<span class="text-subtle-2 shrink-0">Paused</span>
	{:else}
		<span
			id={rateLabelId}
			class="text-subtle-2 shrink-0">Updates</span
		>
		<div class="max-w-40 min-w-0 flex-1">
			<Select
				items={rateItems}
				bind:value={getSelectedRate, pickRate}
				aria-labelledby={rateLabelId}
			/>
		</div>
	{/if}
	<span
		class="sr-only"
		role="status"
	>
		{announcement}
	</span>
</div>
