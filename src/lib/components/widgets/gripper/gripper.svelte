<script lang="ts">
	import { GripperClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import IsMoving from '$lib/components/is-moving.svelte'
	import { Section } from '$lib/components/section'
	import StopButton from '$lib/components/stop-button.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import GetCurrentInputsWidget from './get-current-inputs-widget.svelte'
	import GoToInputsWidget from './go-to-inputs-widget.svelte'
	import IsHoldingSomethingWidget from './is-holding-something-widget.svelte'
	import OpenGrabControl from './open-grab-control.svelte'

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
		<!-- 172 steps of 4 px is the board's 688 px maximum, the widest the layers stay useful. -->
		<div class="@container mx-auto max-w-172">
			<div class="flex flex-col divide-y">
				<div
					role="group"
					aria-label="At a glance"
					class="flex flex-wrap items-center gap-x-3 gap-y-2 p-2"
				>
					<!-- Under a host scope, each section draws no heading row and its errors reach this indicator. -->
					<Section.Scope
						method="IsMoving"
						api={ResourceTriplets.Gripper}
					>
						<div class="flex items-center gap-1.5">
							<span class="text-xs font-semibold"><Section.Method /></span>
							<IsMoving
								client={GripperClient}
								api={ResourceTriplets.Gripper}
								{partID}
								{resourceName}
								isCompact
								class="grow-0! p-0!"
							/>
							<Section.Errors />
						</div>
					</Section.Scope>
					<Section.Scope
						method="IsHoldingSomething"
						api={ResourceTriplets.Gripper}
					>
						<div class="flex items-center gap-1.5">
							<span class="text-xs font-semibold"><Section.Method /></span>
							<IsHoldingSomethingWidget
								{partID}
								{resourceName}
								class="grow-0! p-0!"
							/>
							<Section.Errors />
						</div>
					</Section.Scope>
					<Section.Scope
						method="Stop"
						api={ResourceTriplets.Gripper}
						mutations={[stopMutation]}
					>
						<div class="ml-auto flex items-center gap-1.5">
							<StopButton
								onStop={() => {
									stopMutation.mutate([])
								}}
							/>
							<Section.Errors />
						</div>
					</Section.Scope>
				</div>

				<div
					role="group"
					aria-label="Mutators"
					class="grid min-w-0 grid-cols-1 divide-y @2xl:grid-cols-2 @2xl:divide-x @2xl:divide-y-0"
				>
					<OpenGrabControl
						{partID}
						{resourceName}
					/>
					<GoToInputsWidget
						{partID}
						{resourceName}
					/>
				</div>

				<div
					role="group"
					aria-label="Queries"
					class="flex min-w-0 flex-col"
				>
					<GetCurrentInputsWidget
						{partID}
						{resourceName}
					/>
				</div>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>
