<script lang="ts">
	import { Pill } from '@viamrobotics/prime-core'
	import { GripperClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import Query from '$lib/components/query.svelte'
	import StatusPill from '$lib/components/status-pill.svelte'

	import ClosedGripperSvg from './closed-gripper-svg.svelte'
	import OpenGripperSvg from './open-gripper-svg.svelte'

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
	title="IsHoldingSomething"
	api="rdk:component:gripper"
	bottomText="Updates automatically"
	class="grow"
>
	<Query
		{query}
		contentCx="h-5"
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
	</Query>
</ApiSection>
