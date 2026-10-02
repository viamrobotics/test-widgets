<script lang="ts">
	import { ServoClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import IsMoving from '$lib/components/is-moving.svelte'
	import Query from '$lib/components/query.svelte'
	import { Section } from '$lib/components/section'
	import { useSectionErrors } from '$lib/components/section/use-section-errors.svelte'
	import StopButton from '$lib/components/stop-button.svelte'
	import { formatNumeric } from '$lib/format'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import Move from './move.svelte'
	import QuickMove from './quick-move.svelte'

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

	const positionQuery = createResourceQuery(client, 'getPosition', {
		refetchInterval: 500,
	})

	const moveMutation = createResourceMutation(client, 'move')
	const quickMoveMutation = createResourceMutation(client, 'move')
	const stopMutation = createResourceMutation(client, 'stop')

	const quickMoveErrors = useSectionErrors(() => ({ mutations: [quickMoveMutation] }))

	const moveTo = (angle: number) => {
		moveMutation.mutate([angle], {})
	}

	const quickMoveTo = (angle: number) => {
		quickMoveMutation.mutate([angle], {})
	}
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="@container">
			<div class="flex flex-col divide-y @4xl:flex-row @4xl:divide-x @4xl:divide-y-0">
				<div class="@container grow">
					<div class="grid grid-cols-1 divide-y @2xl:grid-cols-3 @2xl:divide-x @2xl:divide-y-0">
						<ApiSection
							class="grow flex-col gap-4"
							method="GetPosition"
							api={ResourceTriplets.Servo}
						>
							<Query query={positionQuery}>
								{#if positionQuery.data !== undefined}
									<!-- span required to get unit closer to position reading -->
									<span class="flex flex-row gap-1">
										<span class="font-roboto-mono font-normal"
											>{formatNumeric(positionQuery.data)}</span
										>
										<abbr class="text-subtle-2">º</abbr>
									</span>
								{/if}
							</Query>
							<Section.Text class="mt-auto">Updates automatically</Section.Text>
						</ApiSection>
						<ApiSection
							class="grow flex-col gap-4"
							method="Move"
							api={ResourceTriplets.Servo}
							mutations={[moveMutation]}
						>
							<Query query={positionQuery}>
								{#if positionQuery.data !== undefined}
									<Move
										currentPosition={positionQuery.data}
										{moveTo}
									/>
								{/if}
							</Query>
						</ApiSection>
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
							<Section.Body>
								<Query query={positionQuery}>
									{#if positionQuery.data !== undefined}
										<QuickMove
											currentPosition={positionQuery.data}
											moveTo={quickMoveTo}
										/>
									{/if}
								</Query>
								<Section.Text class="mt-auto">Press a button to execute</Section.Text>
							</Section.Body>
						</Section>
					</div>
				</div>
				<div class="flex flex-col divide-y @4xl:ml-auto @4xl:w-full @4xl:max-w-40">
					<ApiSection
						class="grow flex-col gap-4"
						method="Stop"
						api={ResourceTriplets.Servo}
						mutations={[stopMutation]}
					>
						<StopButton
							onStop={() => {
								stopMutation.mutate([])
							}}
						/>
					</ApiSection>
					<IsMoving
						client={ServoClient}
						api={ResourceTriplets.Servo}
						{partID}
						{resourceName}
					/>
				</div>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>
