<script lang="ts">
	import { GripperClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import IsMovingView from '$lib/components/is-moving.svelte'
	import StopButton from '$lib/components/stop-button.svelte'

	import Grab from './grab.svelte'
	import Open from './open.svelte'

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
		<div class="flex flex-row divide-x">
			<span class="flex flex-row gap-4">
				<ApiSection
					title="Open"
					class="gap-3 pr-0"
				>
					<Open
						{partID}
						{resourceName}
					/>
				</ApiSection>
				<ApiSection
					title="Grab"
					class="gap-3 pl-0"
				>
					<Grab
						{partID}
						{resourceName}
					/>
				</ApiSection>
			</span>
			<div class="ml-auto flex w-full max-w-40 flex-col divide-y">
				<ApiSection title="Stop">
					<StopButton
						error={stopMutation.error}
						onStop={() => {
							stopMutation.mutate([])
						}}
					/>
				</ApiSection>
				<IsMovingView
					client={GripperClient}
					{partID}
					{resourceName}
				/>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>
