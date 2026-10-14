<script lang="ts">
	import { GantryClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import IsMoving from '$lib/components/is-moving.svelte'
	import { Section } from '$lib/components/section'
	import { useSectionErrors } from '$lib/components/section/use-section-errors.svelte'
	import StopButton from '$lib/components/stop-button.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import Home from './home.svelte'
	import MoveToPosition from './move-to-position.svelte'
	import PositionAndLengths from './position-and-lengths.svelte'
	import QuickMove from './quick-move.svelte'

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

	const options = { refetchInterval: 500 }
	const positionQuery = createResourceQuery(client, 'getPosition', options)
	const lengthsQuery = createResourceQuery(client, 'getLengths', options)

	const moveMutation = createResourceMutation(client, 'moveToPosition')
	const quickMoveMutation = createResourceMutation(client, 'moveToPosition')
	const stopMutation = createResourceMutation(client, 'stop')

	const quickMoveErrors = useSectionErrors(() => ({
		queries: [positionQuery],
		mutations: [quickMoveMutation],
	}))
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="@container">
			<div class="flex flex-col divide-y @4xl:flex-row @4xl:divide-x @4xl:divide-y-0">
				<div class="@container grow">
					<div class="flex flex-col divide-y @2xl:flex-row @2xl:divide-x @2xl:divide-y-0">
						<ApiSection
							class="grow flex-col gap-4"
							method="GetPosition"
							api={ResourceTriplets.Gantry}
							queries={[positionQuery, lengthsQuery]}
						>
							{@const positions = positionQuery.data}
							{@const lengths = lengthsQuery.data ?? []}
							{#if positions !== undefined}
								<PositionAndLengths
									{positions}
									{lengths}
								/>
							{/if}
							<Section.Text class="mt-auto">Updates automatically</Section.Text>
						</ApiSection>
						<ApiSection
							class="grow flex-col gap-4"
							method="MoveToPosition"
							api={ResourceTriplets.Gantry}
							queries={[positionQuery]}
							mutations={[moveMutation]}
						>
							{@const positions = positionQuery.data}
							{#if positions !== undefined}
								<MoveToPosition
									{positions}
									moveTo={(newPos: number[], speeds: number[]) => {
										moveMutation.mutate([newPos, speeds], {})
									}}
								/>
							{/if}
						</ApiSection>
						<div class="flex grow flex-col divide-y">
							<Section
								errorReporter={quickMoveErrors}
								class="grow flex-col gap-4"
							>
								<div class="flex flex-col gap-0.5">
									<Section.Heading>
										Quick move
										{#snippet aside()}
											<Section.Errors errors={quickMoveErrors.errors} />
										{/snippet}
									</Section.Heading>
								</div>
								<Section.Body isLoading={quickMoveErrors.isLoading}>
									{@const positions = positionQuery.data}
									{#if positions !== undefined}
										<QuickMove
											{positions}
											moveTo={(newPos: number[], speeds: number[]) => {
												quickMoveMutation.mutate([newPos, speeds], {})
											}}
										/>
									{/if}
									<Section.Text class="mt-auto">Press a button to execute</Section.Text>
								</Section.Body>
							</Section>
							<Home
								{partID}
								{resourceName}
							/>
						</div>
					</div>
				</div>
				<div class="flex flex-col divide-y @4xl:ml-auto @4xl:w-full @4xl:max-w-40">
					<ApiSection
						class="grow flex-col gap-4"
						method="Stop"
						api={ResourceTriplets.Gantry}
						mutations={[stopMutation]}
					>
						<StopButton
							onStop={() => {
								stopMutation.mutate([])
							}}
						/>
					</ApiSection>
					<IsMoving
						client={GantryClient}
						api={ResourceTriplets.Gantry}
						{partID}
						{resourceName}
					/>
				</div>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>
