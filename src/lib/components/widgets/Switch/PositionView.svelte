<script lang="ts">
	import { SwitchClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import StatusLine from '#lib/components/StatusLine.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'
	import { untrack } from 'svelte'

	import Position from './Position.svelte'
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

	let statusText = $state('')

	// No optimistic write: the selection follows GetPosition, re-read once SetPosition settles.
	const onSelect = async (index: number, label: string) => {
		const outcome = await position.run(() => {
			statusText = `Sending ${label}.`
			return setPositionMutation.mutateAsync([index])
		})
		if (outcome === undefined) return
		statusText = outcome === 'succeeded' ? `Set to ${label}.` : ''
		void positionQuery.refetch()
	}
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
