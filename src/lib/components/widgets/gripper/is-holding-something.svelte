<script lang="ts">
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
	bottomText="Updates automatically"
	class="grow"
>
	<Query
		{query}
		contentCx="h-5"
	>
		<div class="flex items-center gap-2">
			{#if query.data}
				<ClosedGripperSvg />
			{:else}
				<OpenGripperSvg />
			{/if}
			<StatusPill
				isActive={query.data ?? false}
				activeText="Holding"
				inactiveText="Empty"
			/>
		</div>
	</Query>
</ApiSection>
