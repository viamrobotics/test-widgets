<script lang="ts">
	import { InputControllerClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import RefetchController from '$lib/components/refetch-controller.svelte'
	import { createRefetchIntervalStore } from '$lib/components/refetch-interval-store.svelte'

	import GetEventsWidget from './get-events-widget.svelte'
	import TriggerEventWidget from './trigger-event-widget.svelte'
	import Webgamepad from './webgamepad.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	// 224 steps of 4 px is 896 px, where the second column is the last one worth drawing.
	const LAYER_GRID_CLASS =
		'grid grid-cols-1 border-t border-light @2xl:grid-cols-2 *:min-w-0 *:*:grow *:border-b *:border-light @2xl:*:border-r @2xl:*:nth-[2n]:border-r-0'

	const glanceLabelId = $props.id()

	const refetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'input-controller'
	)

	const client = createResourceClient(
		InputControllerClient,
		() => partID,
		() => resourceName
	)

	const eventsQuery = createResourceQuery(client, 'getEvents', () => ({
		refetchInterval: refetchInterval.current,
	}))

	let isGamepadConnected = $state(false)

	const isWebgamepad = $derived(resourceName.toLowerCase() === 'webgamepad')
	const badgeTone = $derived(isGamepadConnected ? 'badge-success' : 'badge-neutral')
	const badgeText = $derived(isGamepadConnected ? 'Connected' : 'Disconnected')
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="@container mx-auto max-w-4xl">
			<div class="p-2">
				<RefetchController
					{refetchInterval}
					queries={[eventsQuery]}
				/>
			</div>

			{#if isWebgamepad}
				<div
					role="group"
					aria-labelledby={glanceLabelId}
					class="flex flex-wrap items-center gap-2 p-2"
				>
					<span
						id={glanceLabelId}
						class="text-subtle-1 text-xs"
					>
						At a glance
					</span>
					<span class={['badge', badgeTone]}>{badgeText}</span>
				</div>
			{/if}

			<div
				role="group"
				aria-label="Mutators"
				class={LAYER_GRID_CLASS}
			>
				{#if isWebgamepad}
					<div class="flex flex-col gap-2 p-2">
						<span class="text-subtle-1 text-xs">Webgamepad</span>
						<Webgamepad
							{partID}
							{resourceName}
							bind:isConnected={isGamepadConnected}
						/>
					</div>
				{/if}
				<div class="flex flex-col">
					<TriggerEventWidget
						{partID}
						{resourceName}
					/>
				</div>
			</div>

			<div
				role="group"
				aria-label="Queries"
				class={LAYER_GRID_CLASS}
			>
				<div class="flex flex-col">
					<GetEventsWidget
						{partID}
						{resourceName}
						refetchInterval={refetchInterval.current}
					/>
				</div>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>
