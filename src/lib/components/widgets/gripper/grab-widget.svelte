<script lang="ts">
	import { StatusDot } from '@viamrobotics/prime-ui'
	import { GripperClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import Grab from './grab.svelte'

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

	const grabMutation = createResourceMutation(client, 'grab')

	const isGrabbed = $derived(grabMutation.data)

	const grabbedLabelId = $props.id()
</script>

<ApiSection
	method="Grab"
	api={ResourceTriplets.Gripper}
	mutations={[grabMutation]}
	class="grow-0 flex-col gap-4"
>
	<div class="flex">
		<Grab onGrab={() => grabMutation.mutate([], {})} />
	</div>
	<div class="flex min-w-0 items-center gap-2">
		<span
			id={grabbedLabelId}
			class="text-subtle-1 text-xs">Grabbed</span
		>
		<span
			role="group"
			aria-labelledby={grabbedLabelId}
			class="readout font-roboto-mono inline-flex items-center gap-2"
		>
			{#if isGrabbed === undefined}
				-
			{:else}
				<StatusDot
					state={isGrabbed ? 'success' : 'disabled'}
					label="Grabbed"
				/>
				{isGrabbed ? 'Yes' : 'No'}
			{/if}
		</span>
	</div>
</ApiSection>
