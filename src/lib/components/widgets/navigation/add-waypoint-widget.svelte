<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { NumberField } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'
	import { NavigationClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		NavigationClient,
		() => partID,
		() => resourceName
	)

	const addWaypointMutation = createResourceMutation(client, 'addWayPoint')

	let latitude = $state<number | undefined>(undefined)
	let longitude = $state<number | undefined>(undefined)

	// An empty field is `undefined`, so it holds back Execute.
	const validLatitude: number | undefined = $derived(
		latitude !== undefined && Number.isFinite(latitude) ? latitude : undefined
	)
	const validLongitude: number | undefined = $derived(
		longitude !== undefined && Number.isFinite(longitude) ? longitude : undefined
	)

	const addWaypoint = () => {
		if (validLatitude === undefined || validLongitude === undefined) return
		addWaypointMutation.mutate([{ latitude: validLatitude, longitude: validLongitude }])
	}
</script>

<ApiSection
	method="AddWaypoint"
	api={ResourceTriplets.Navigation}
	mutations={[addWaypointMutation]}
	class="grow flex-col gap-2"
>
	<div class="flex w-full flex-col gap-1">
		<div class="flex flex-wrap gap-1">
			<div class="min-w-0 flex-[1_1_12rem]">
				<NumberField
					label="Latitude"
					suffix="°"
					state={validLatitude === undefined ? 'error' : undefined}
					bind:value={latitude}
				/>
			</div>
			<div class="min-w-0 flex-[1_1_12rem]">
				<NumberField
					label="Longitude"
					suffix="°"
					state={validLongitude === undefined ? 'error' : undefined}
					bind:value={longitude}
				/>
			</div>
		</div>
		<div class="flex justify-end">
			<button
				type="button"
				class="button button-compact"
				disabled={validLatitude === undefined || validLongitude === undefined}
				onclick={addWaypoint}
			>
				<Icon icon={mdiPlayCircleOutline} />
				Execute
			</button>
		</div>
	</div>
</ApiSection>
