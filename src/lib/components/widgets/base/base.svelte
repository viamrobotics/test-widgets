<script lang="ts">
	import { BaseClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import IsMoving from '$lib/components/is-moving.svelte'
	import { Section } from '$lib/components/section'
	import StopButton from '$lib/components/stop-button.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import MoveStraightWidget from './move-straight-widget.svelte'
	import QuickMoveWidget from './quick-move-widget.svelte'
	import SetPowerWidget from './set-power-widget.svelte'
	import SetVelocityWidget from './set-velocity-widget.svelte'
	import SpinWidget from './spin-widget.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		BaseClient,
		() => partID,
		() => resourceName
	)

	const stopMutation = createResourceMutation(client, 'stop')
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="@container">
			<div class="flex flex-col divide-y">
				<div
					role="group"
					aria-label="Status and stop"
					class="flex flex-wrap items-center gap-x-3 gap-y-2 p-2"
				>
					<!-- Under a host scope, IsMoving's section draws no heading row and its errors reach this indicator. -->
					<Section.Scope
						method="IsMoving"
						api={ResourceTriplets.Base}
					>
						<div class="flex items-center gap-1.5">
							<span class="text-xs font-semibold"><Section.Method /></span>
							<IsMoving
								client={BaseClient}
								api={ResourceTriplets.Base}
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
						api={ResourceTriplets.Base}
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

				<!-- Quick move sits third, in Spin's old slot, so the taller WASD cross gets the row with room. -->
				<div
					role="group"
					aria-label="Mutators"
					class="grid grid-cols-1 divide-y @2xl:grid-cols-2 @2xl:divide-y-0 @4xl:grid-cols-3"
				>
					<SpinWidget
						{partID}
						{resourceName}
					/>
					<MoveStraightWidget
						{partID}
						{resourceName}
					/>
					<QuickMoveWidget
						{partID}
						{resourceName}
					/>
					<SetPowerWidget
						{partID}
						{resourceName}
					/>
					<SetVelocityWidget
						{partID}
						{resourceName}
					/>
				</div>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>
