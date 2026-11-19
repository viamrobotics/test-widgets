<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { Select } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'
	import { NavigationClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import { waypointLabel } from './waypoint-label'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const REFETCH_INTERVAL_MS = 1000
	// An item value is never empty, because bits-ui reads `''` as nothing selected.
	const NO_CHOICE = ''

	const client = createResourceClient(
		NavigationClient,
		() => partID,
		() => resourceName
	)

	const waypointsQuery = createResourceQuery(client, 'getWayPoints', {
		refetchInterval: REFETCH_INTERVAL_MS,
	})
	const removeWaypointMutation = createResourceMutation(client, 'removeWayPoint')

	let chosenId = $state(NO_CHOICE)

	const items = $derived(
		(waypointsQuery.data ?? []).map((waypoint, index) => ({
			value: waypoint.id,
			label: waypointLabel(index),
		}))
	)

	// A waypoint removed elsewhere leaves a stale choice, which holds back Execute.
	const validId = $derived(items.some((item) => item.value === chosenId) ? chosenId : undefined)

	const getChosenId = () => chosenId
	const chooseId = (next: string | undefined) => {
		chosenId = next ?? NO_CHOICE
	}

	const labelId = $props.id()

	const removeWaypoint = () => {
		if (validId === undefined) return
		removeWaypointMutation.mutate([validId], {
			onSuccess: () => {
				chosenId = NO_CHOICE
				void waypointsQuery.refetch()
			},
		})
	}
</script>

<ApiSection
	method="RemoveWaypoint"
	api={ResourceTriplets.Navigation}
	queries={[waypointsQuery]}
	mutations={[removeWaypointMutation]}
	class="grow flex-col gap-2"
>
	<div class="flex w-full flex-col gap-1">
		<span
			id={labelId}
			class="text-subtle-1 text-xs"
		>
			Waypoint
		</span>
		<Select
			{items}
			bind:value={getChosenId, chooseId}
			placeholder="Choose a waypoint"
			aria-labelledby={labelId}
		/>
		<div class="flex justify-end">
			<button
				type="button"
				class="button button-compact"
				disabled={validId === undefined}
				onclick={removeWaypoint}
			>
				<Icon icon={mdiPlayCircleOutline} />
				Execute
			</button>
		</div>
	</div>
</ApiSection>
