<script lang="ts">
	import { Pill } from '@viamrobotics/prime-core'
	import { GripperClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { Section } from '#lib/components/Section/index.js'
	import StatusPill from '#lib/components/StatusPill.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import ClosedGripperSvg from './ClosedGripperSvg.svelte'
	import OpenGripperSvg from './OpenGripperSvg.svelte'

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

	const query = createResourceQuery(client, 'isHoldingSomething', {
		refetchInterval: 500,
	})
</script>

<ApiSection
	method="IsHoldingSomething"
	api={ResourceTriplets.Gripper}
	class="grow flex-col gap-4"
	queries={[query]}
>
	<div class="flex items-center gap-2">
		{#if query.data !== undefined}
			{#if query.data}
				<ClosedGripperSvg />
			{:else}
				<OpenGripperSvg />
			{/if}
			<StatusPill
				isActive={query.data}
				activeText="Holding"
				inactiveText="Empty"
			/>
		{:else}
			<Pill value="Loading" />
		{/if}
	</div>
	<Section.Text class="mt-auto">Updates automatically</Section.Text>
</ApiSection>
