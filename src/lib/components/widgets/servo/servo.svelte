<script lang="ts">
	import { ServoClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import IsMoving from '$lib/components/is-moving.svelte'
	import { Section } from '$lib/components/section'
	import StopButton from '$lib/components/stop-button.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import GetPositionWidget from './get-position-widget.svelte'
	import MoveWidget from './move-widget.svelte'
	import QuickMoveWidget from './quick-move-widget.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		ServoClient,
		() => partID,
		() => resourceName
	)

	const stopMutation = createResourceMutation(client, 'stop')
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<!-- 172 steps of 4 px is the board's 688 px maximum, the widest the two columns stay useful. -->
		<div class="@container mx-auto max-w-172">
			<div class="flex flex-col divide-y">
				<div
					role="group"
					aria-label="At a glance"
					class="flex flex-wrap items-center gap-x-3 gap-y-2 p-2"
				>
					<!-- Under a host scope, IsMoving's section draws no heading row and its errors reach this indicator. -->
					<Section.Scope
						method="IsMoving"
						api={ResourceTriplets.Servo}
					>
						<div class="flex items-center gap-1.5">
							<span class="text-xs font-semibold"><Section.Method /></span>
							<IsMoving
								client={ServoClient}
								api={ResourceTriplets.Servo}
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
						api={ResourceTriplets.Servo}
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
					class="grid grid-cols-1 divide-y @2xl:grid-cols-2 @2xl:divide-x @2xl:divide-y-0"
				>
					<div class="flex min-w-0 flex-col">
						<MoveWidget
							{partID}
							{resourceName}
						/>
					</div>
					<div class="flex min-w-0 flex-col">
						<QuickMoveWidget
							{partID}
							{resourceName}
						/>
					</div>
				</div>

				<div class="flex min-w-0 flex-col">
					<GetPositionWidget
						{partID}
						{resourceName}
					/>
				</div>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>
