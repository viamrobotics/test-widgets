<script lang="ts">
	import { GantryClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import { apiDocsHref } from '$lib/api-docs-href'
	import ApiSection from '$lib/components/api-section.svelte'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import IsMoving from '$lib/components/is-moving.svelte'
	import Queries from '$lib/components/queries.svelte'
	import Query from '$lib/components/query.svelte'
	import StopButton from '$lib/components/stop-button.svelte'

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

	const positionHeadingID = $props.id()
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="@container">
			<div class="flex flex-col divide-y @4xl:flex-row @4xl:divide-x @4xl:divide-y-0">
				<div class="@container grow">
					<div class="flex flex-col divide-y @2xl:flex-row @2xl:divide-x @2xl:divide-y-0">
						<ApiSection
							bottomText="Updates automatically"
							aria-labelledby={positionHeadingID}
						>
							<h3
								class="text-subtle-2 flex flex-row items-center gap-1 text-sm"
								id={positionHeadingID}
							>
								<a
									href={apiDocsHref('rdk:component:gantry', 'getPosition')}
									target="_blank"
									rel="noopener noreferrer external"
									class="decoration-gray-5 hover:decoration-default text-default font-mono font-semibold underline underline-offset-3"
								>
									GetPosition
								</a>
								and
								<a
									href={apiDocsHref('rdk:component:gantry', 'getLengths')}
									target="_blank"
									rel="noopener noreferrer external"
									class="decoration-gray-5 hover:decoration-default text-default font-mono font-semibold underline underline-offset-3"
								>
									GetLengths
								</a>
							</h3>
							<Queries queries={[positionQuery, lengthsQuery]}>
								{@const positions = positionQuery.data}
								{@const lengths = lengthsQuery.data ?? []}
								{#if positions !== undefined}
									<PositionAndLengths
										{positions}
										{lengths}
									/>
								{/if}
							</Queries>
						</ApiSection>
						<ApiSection
							title="MoveToPosition"
							api="rdk:component:gantry"
						>
							<Query query={positionQuery}>
								{@const positions = positionQuery.data}
								{#if positions !== undefined}
									<MoveToPosition
										{positions}
										lastError={moveMutation.error}
										moveTo={(newPos: number[], speeds: number[]) => {
											moveMutation.mutate([newPos, speeds], {})
										}}
									/>
								{/if}
							</Query>
						</ApiSection>
						<div class="flex grow flex-col divide-y">
							<ApiSection
								title="Quick move"
								bottomText="Press a button to execute"
							>
								<Query
									query={positionQuery}
									contentCx="h-6"
								>
									{@const positions = positionQuery.data}
									{#if positions !== undefined}
										<QuickMove
											{positions}
											lastError={quickMoveMutation.error}
											moveTo={(newPos: number[], speeds: number[]) => {
												quickMoveMutation.mutate([newPos, speeds], {})
											}}
										/>
									{/if}
								</Query>
							</ApiSection>
							<ApiSection
								title="Home"
								api="rdk:component:gantry"
								description="Run the homing sequence"
							>
								<Home
									{partID}
									{resourceName}
								/>
							</ApiSection>
						</div>
					</div>
				</div>
				<div class="flex flex-col divide-y @4xl:ml-auto @4xl:w-full @4xl:max-w-40">
					<ApiSection
						title="Stop"
						api="rdk:component:gantry"
					>
						<StopButton
							error={stopMutation.error}
							onStop={() => {
								stopMutation.mutate([])
							}}
						/>
					</ApiSection>
					<IsMoving
						client={GantryClient}
						api="rdk:component:gantry"
						{partID}
						{resourceName}
					/>
				</div>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>
