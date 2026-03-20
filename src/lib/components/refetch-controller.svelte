<script lang="ts">
	import { onMount } from 'svelte';
	import type { Writable } from 'svelte/store';
	import type { QueryObserverResult } from '@tanstack/svelte-query';

	import { IconButton, Select } from '@viamrobotics/prime-core';

	import {
		RefetchIntervals,
		type RefetchRate,
		RefetchRates,
		RefetchRateToInterval
	} from './refetch-controller';

	interface Props {
		refetchInterval: Writable<number | false>;
		queries: QueryObserverResult[];
		refetchNotifyDurationMs?: number;
		allowLive?: boolean;
	}

	const {
		refetchInterval,
		queries,
		refetchNotifyDurationMs = 500,
		allowLive = false
	}: Props = $props();

	let selectedOption: string = $state(RefetchRates.ONE_SEC);

	$effect.pre(() => {
		selectedOption =
			RefetchRateToInterval.find(([_, interval]) => interval === $refetchInterval)?.[0] ??
			RefetchRates.ONE_SEC;
	});

	const selectOption = (selected: string) => {
		selectedOption = selected as RefetchRate;
		const interval =
			RefetchRateToInterval.find(([rate, _]) => rate === selectedOption)?.[1] ??
			RefetchIntervals.ONE_SEC;
		refetchInterval.set(interval);
	};

	let refetchState: 'idle' | 'success' | 'refetching' = $state('idle');
	const manualIconState = $derived(
		{
			idle: { name: 'refresh' as const },
			success: { name: 'check' as const },
			refetching: { progress: 'indeterminate' as const }
		}[refetchState]
	);

	let refetchingStateTimeout: number;
	const refetchQueries = async () => {
		// Clear the timeout to prevent races if refetchQueries is called during a refetch
		clearTimeout(refetchingStateTimeout);
		// This is in a timeout to prevent icon-flashing on very quick queries
		refetchingStateTimeout = window.setTimeout(() => {
			refetchState = 'refetching';
		}, 250);
		const refetchCalls = queries.map(async (query) => query.refetch());
		await Promise.all(refetchCalls);
		clearTimeout(refetchingStateTimeout);
		refetchState = 'success';
		resetToIdleEventually();
	};

	let stateNotifyTimeout: number;
	const resetToIdleEventually = () => {
		window.clearTimeout(stateNotifyTimeout);
		stateNotifyTimeout = window.setTimeout(() => {
			refetchState = 'idle';
		}, refetchNotifyDurationMs);
	};

	const onChange = (event: Event) => {
		selectOption((event.target as HTMLSelectElement).value);
	};

	const refetchOptions = $derived(
		allowLive
			? Object.values(RefetchRates)
			: Object.values(RefetchRates).filter((value) => value !== RefetchRates.LIVE)
	);

	onMount(() => {
		return () => window.clearTimeout(stateNotifyTimeout);
	});
</script>

<div class="text-default flex flex-row gap-2 text-xs">
	<div class="w-50">
		<Select on:change={onChange}>
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
				selectOption(RefetchRates.MANUAL);
			}}
		/>
	{/if}
</div>
