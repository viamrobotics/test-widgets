<script lang="ts">
	import { GantryClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import IsMoving from '$lib/components/is-moving.svelte'
	import { Section } from '$lib/components/section'
	import StopButton from '$lib/components/stop-button.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import GetLengthsWidget from './get-lengths-widget.svelte'
	import GetPositionWidget from './get-position-widget.svelte'
	import Home from './home.svelte'
	import MoveToPositionWidget from './move-to-position-widget.svelte'
	import QuickMoveWidget from './quick-move-widget.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		GantryClient,
		() => partID,
		() => resourceName
	)

	const stopMutation = createResourceMutation(client, 'stop')
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="@container mx-auto max-w-2xl">
			<div class="flex flex-col divide-y">
				<div
					role="group"
					aria-label="At a glance"
					class="flex flex-wrap items-center gap-x-3 gap-y-2 p-2"
				>
					<!-- Under a host scope, IsMoving's section draws no heading row and its errors reach this indicator. -->
					<Section.Scope
						method="IsMoving"
						api={ResourceTriplets.Gantry}
					>
						<div class="flex items-center gap-1.5">
							<span class="text-xs font-semibold"><Section.Method /></span>
							<IsMoving
								client={GantryClient}
								api={ResourceTriplets.Gantry}
								{partID}
								{resourceName}
								isCompact
								class="grow-0! p-0!"
							/>
							<Section.Errors />
						</div>
					</Section.Scope>
					<Section.Scope
						method="Stop"
						api={ResourceTriplets.Gantry}
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

				<!-- From 672 px, Quick move sits over Home on the left, and MoveToPosition, the taller, takes the right. -->
				<div
					role="group"
					aria-label="Mutators"
					class="grid grid-cols-1 divide-y @2xl:grid-cols-2 @2xl:divide-x @2xl:divide-y-0"
				>
					<div class="flex min-w-0 flex-col divide-y">
						<QuickMoveWidget
							{partID}
							{resourceName}
						/>
						<Home
							{partID}
							{resourceName}
						/>
					</div>
					<div class="flex min-w-0 flex-col">
						<MoveToPositionWidget
							{partID}
							{resourceName}
						/>
					</div>
				</div>

				<div
					role="group"
					aria-label="Queries"
					class="grid grid-cols-1 divide-y @2xl:grid-cols-2 @2xl:divide-x @2xl:divide-y-0"
				>
					<div class="flex min-w-0 flex-col">
						<GetPositionWidget
							{partID}
							{resourceName}
						/>
					</div>
					<div class="flex min-w-0 flex-col">
						<GetLengthsWidget
							{partID}
							{resourceName}
						/>
					</div>
				</div>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>
