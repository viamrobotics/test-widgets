<script lang="ts">
	import { SwitchClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'
	import { untrack } from 'svelte'

	import ApiSection from '$lib/components/api-section.svelte'
	import StatusLine from '$lib/components/status-line.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import Position from './position.svelte'
	import { useSwitchState } from './switch-state.svelte.ts'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		SwitchClient,
		() => partID,
		() => resourceName
	)

	const positionQuery = createResourceQuery(client, 'getPosition', {
		refetchInterval: 500,
	})

	const numberOfPositionsQuery = createResourceQuery(client, 'getNumberOfPositions')

	const setPositionMutation = createResourceMutation(client, 'setPosition')

	const { position } = untrack(() => useSwitchState(partID, resourceName))

	let sendingLabel = $state('')

	// No optimistic write: the selection follows GetPosition, re-read once SetPosition settles.
	const onSelect = async (index: number, label: string) => {
		const outcome = position.run(() => {
			sendingLabel = label
			return setPositionMutation.mutateAsync([index])
		})
		if (outcome === undefined) return
		await outcome
		sendingLabel = ''
		void positionQuery.refetch()
	}

	const statusText = $derived(position.isBusy ? `Sending ${sendingLabel}.` : '')
</script>

<ApiSection
	class="flex-col gap-4"
	method="SetPosition"
	api={ResourceTriplets.Switch}
	queries={[positionQuery, numberOfPositionsQuery]}
	mutations={[setPositionMutation]}
>
	{#if positionQuery.data !== undefined && numberOfPositionsQuery.data !== undefined}
		{@const labels = numberOfPositionsQuery.data[1]}
		<div class="flex w-full min-w-0 flex-col gap-1">
			<Position
				numPositions={numberOfPositionsQuery.data[0]}
				{labels}
				currentPosition={positionQuery.data}
				isBusy={position.isBusy}
				onSelect={(index) => onSelect(index, labels[index] ?? String(index))}
			/>
			<StatusLine text={statusText} />
		</div>
	{/if}
</ApiSection>
