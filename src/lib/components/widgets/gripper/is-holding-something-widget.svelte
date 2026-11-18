<script lang="ts">
	import type { ClassValue } from 'svelte/elements'

	import { Tooltip } from '@viamrobotics/prime-ui'
	import { GripperClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	interface Props {
		partID: string
		resourceName: string
		class?: ClassValue
	}

	const { partID, resourceName, class: className }: Props = $props()

	const client = createResourceClient(
		GripperClient,
		() => partID,
		() => resourceName
	)

	const query = createResourceQuery(client, 'isHoldingSomething', {
		refetchInterval: 500,
	})

	const badgeTone = $derived(query.data ? 'badge-success' : 'badge-neutral')

	const badgeText = $derived.by(() => {
		if (query.data === undefined) return '-'
		return query.data ? 'Holding' : 'Empty'
	})
</script>

<ApiSection
	method="IsHoldingSomething"
	api={ResourceTriplets.Gripper}
	class={['grow flex-col gap-4', className]}
	queries={[query]}
>
	<Tooltip>
		<Tooltip.Trigger>
			<!-- Keyboard focus is the only way to open the tooltip without a pointer. -->
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<span
				class={['badge', badgeTone]}
				tabindex="0"
			>
				{badgeText}
			</span>
		</Tooltip.Trigger>
		<Tooltip.Content>Updates automatically</Tooltip.Content>
	</Tooltip>
</ApiSection>
