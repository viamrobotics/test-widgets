<script lang="ts">
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import { Section } from '$lib/components/section'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import GetNumberOfPositionsWidget from './get-number-of-positions-widget.svelte'
	import GetPositionWidget from './get-position-widget.svelte'
	import PositionView from './position-view.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<!-- 168 steps of 4 px is the board's 672 px maximum, two columns of 336 px. -->
		<div
			class="@container mx-auto max-w-2xl"
			data-testid="switch-composite"
		>
			<div class="flex flex-col divide-y">
				<div
					role="group"
					aria-label="At a glance"
					class="flex flex-wrap items-center gap-x-3 gap-y-2 p-2"
				>
					<!-- Under a host scope, the section draws no heading row and its errors reach this indicator. -->
					<Section.Scope
						method="GetPosition"
						api={ResourceTriplets.Switch}
					>
						<div class="flex items-center gap-1.5">
							<GetPositionWidget
								{partID}
								{resourceName}
							/>
							<Section.Errors />
						</div>
					</Section.Scope>
				</div>

				<div
					class="grid min-w-0 grid-cols-1 divide-y @2xl:grid-cols-2 @2xl:divide-x @2xl:divide-y-0"
				>
					<div
						role="group"
						aria-label="Mutators"
						class="flex min-w-0 flex-col"
					>
						<PositionView
							{partID}
							{resourceName}
						/>
					</div>

					<div
						role="group"
						aria-label="Queries"
						class="flex min-w-0 flex-col"
					>
						<GetNumberOfPositionsWidget
							{partID}
							{resourceName}
						/>
					</div>
				</div>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>
