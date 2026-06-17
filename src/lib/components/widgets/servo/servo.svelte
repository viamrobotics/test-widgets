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
	import StopButton from '$lib/components/stop-button.svelte'
	import { formatNumeric } from '$lib/format'

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

	const moveTo = (angle: number) => {
		moveMutation.mutate([angle], {})
	}

	const quickMoveTo = (angle: number) => {
		quickMoveMutation.mutate([angle], {})
	}
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="flex flex-row divide-x">
			<div class="grid grow grid-cols-3 divide-x">
				<ApiSection
					title="GetPosition"
					api="rdk:component:servo"
					bottomText="Updates automatically"
				>
					<Query query={positionQuery}>
						{#if positionQuery.data !== undefined}
							<!-- span required to get unit closer to position reading -->
							<span class="flex flex-row gap-1">
								<span class="font-roboto-mono font-normal">{formatNumeric(positionQuery.data)}</span
								>
								<abbr class="text-subtle-2">º</abbr>
							</span>
						{/if}
					</Query>
				</ApiSection>
				<ApiSection
					title="Move"
					api="rdk:component:servo"
				>
					<Query query={positionQuery}>
						{#if positionQuery.data !== undefined}
							<Move
								currentPosition={positionQuery.data}
								{moveTo}
								lastError={moveMutation.error}
							/>
						{/if}
					</Query>
				</ApiSection>
				<ApiSection
					title="Quick move"
					bottomText="Press a button to execute"
				>
					<Query query={positionQuery}>
						{#if positionQuery.data !== undefined}
							<QuickMove
								currentPosition={positionQuery.data}
								moveTo={quickMoveTo}
								lastError={quickMoveMutation.error}
							/>
						{/if}
					</Query>
				</ApiSection>
			</div>
			<div class="ml-auto flex w-full max-w-40 flex-col divide-y">
				<ApiSection
					title="Stop"
					api="rdk:component:servo"
				>
					<StopButton
						error={stopMutation.error}
						onStop={() => {
							stopMutation.mutate([])
						}}
					/>
				</ApiSection>
				<IsMoving
					client={ServoClient}
					api="rdk:component:servo"
					{partID}
					{resourceName}
				/>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>
