<script lang="ts">
	import { ArmClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ConnectionStatus from '$lib/components/connection-status.svelte'

	import GetJointPositionsWidget from './get-joint-positions-widget.svelte'
	import GetManualModeWidget from './get-manual-mode-widget.svelte'
	import IsMovingWidget from './is-moving-widget.svelte'
	import MoveToJointPositionsWidget from './move-to-joint-positions-widget.svelte'
	import MoveToPositionWidget from './move-to-position-widget.svelte'
	import SetManualModeWidget from './set-manual-mode-widget.svelte'
	import StopWidget from './stop-widget.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		ArmClient,
		() => partID,
		() => resourceName
	)

	const properties = createResourceQuery(client, 'getProperties')
	const supportsManualMode = $derived(properties.data?.supportManualMode === true)
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="@container">
			{#if supportsManualMode}
				<div class="flex flex-col border-b">
					<div class="flex min-w-0 flex-col gap-4 @2xl:flex-row @2xl:gap-0">
						<GetManualModeWidget
							{partID}
							{resourceName}
						/>
						<SetManualModeWidget
							{partID}
							{resourceName}
						/>
					</div>

					<p class="text-subtle-2 px-4 pb-4 text-xs">
						Manual mode puts the arm into gravity compensation or servo release mode so the arm can
						be moved by hand.
					</p>
				</div>
			{/if}

			<div class="flex flex-col gap-4 @2xl:flex-row @2xl:gap-0 @2xl:divide-x">
				<div
					class="flex flex-col gap-4 @2xl:grid @2xl:grow @2xl:grid-cols-2 @2xl:gap-0 @2xl:divide-x @4xl:grid-cols-3"
				>
					<GetJointPositionsWidget
						{partID}
						{resourceName}
					/>
					<MoveToJointPositionsWidget
						{partID}
						{resourceName}
					/>
					<MoveToPositionWidget
						{partID}
						{resourceName}
					/>
				</div>

				<div
					class="flex flex-row gap-4 @2xl:ml-auto @2xl:w-full @2xl:max-w-40 @2xl:flex-col @2xl:gap-0 @2xl:divide-y"
				>
					<StopWidget
						{partID}
						{resourceName}
					/>
					<IsMovingWidget
						{partID}
						{resourceName}
					/>
				</div>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>
