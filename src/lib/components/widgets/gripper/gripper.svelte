<script lang="ts">
	import { GripperClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import IsMoving from '$lib/components/is-moving.svelte'
	import StopButton from '$lib/components/stop-button.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import Grab from './grab.svelte'
	import IsHoldingSomething from './is-holding-something.svelte'
	import Open from './open.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		GripperClient,
		() => partID,
		() => resourceName
	)

	const stopMutation = createResourceMutation(client, 'stop')
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="@container">
			<div class="flex flex-col divide-y @lg:flex-row @lg:divide-x @lg:divide-y-0">
				<span class="flex grow flex-wrap gap-4">
					<ApiSection
						title="Open"
						api={ResourceTriplets.Gripper}
						class="grow-0 flex-col gap-3 @xs:pr-0"
					>
						<Open
							{partID}
							{resourceName}
						/>
					</ApiSection>
					<ApiSection
						title="Grab"
						api={ResourceTriplets.Gripper}
						class="grow-0 flex-col gap-3 @xs:pl-0"
					>
						<Grab
							{partID}
							{resourceName}
						/>
					</ApiSection>
				</span>
				<div class="flex flex-col divide-y">
					<ApiSection
						class="grow flex-col gap-4"
						title="Stop"
						api={ResourceTriplets.Gripper}
					>
						<StopButton
							error={stopMutation.error}
							onStop={() => {
								stopMutation.mutate([])
							}}
						/>
					</ApiSection>
					<IsMoving
						client={GripperClient}
						api={ResourceTriplets.Gripper}
						{partID}
						{resourceName}
					/>
					<IsHoldingSomething
						{partID}
						{resourceName}
					/>
				</div>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>
