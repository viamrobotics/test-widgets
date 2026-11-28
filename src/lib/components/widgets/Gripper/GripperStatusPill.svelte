<script lang="ts">
	import { Tooltip } from '@viamrobotics/prime-ui'
	import { GripperClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import { Section, useSectionErrors } from '#lib/components/Section/index.js'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const POLL_INTERVAL_MS = 500
	const UNREAD_PLACEHOLDER = '-'

	const client = createResourceClient(
		GripperClient,
		() => partID,
		() => resourceName
	)

	const isMovingQuery = createResourceQuery(client, 'isMoving', {
		refetchInterval: POLL_INTERVAL_MS,
	})
	const isHoldingQuery = createResourceQuery(client, 'isHoldingSomething', {
		refetchInterval: POLL_INTERVAL_MS,
	})

	const sectionErrors = useSectionErrors(() => ({
		queries: [isMovingQuery, isHoldingQuery],
	}))

	const isMoving = $derived(isMovingQuery.data)
	const isHolding = $derived(isHoldingQuery.data)

	const movingText = $derived.by(() => {
		if (isMoving === undefined) return UNREAD_PLACEHOLDER
		return isMoving ? 'Moving' : 'Idle'
	})
	const holdingText = $derived.by(() => {
		if (isHolding === undefined) return UNREAD_PLACEHOLDER
		return isHolding ? 'Holding' : 'Empty'
	})
	const movingTone = $derived(isMoving ? 'badge-success' : 'badge-neutral')
	const holdingTone = $derived(isHolding ? 'badge-success' : 'badge-neutral')
</script>

<Section
	errorReporter={sectionErrors}
	class="grow flex-col gap-3"
>
	<Section.Heading>
		Status
		{#snippet aside()}
			<Section.Errors errors={sectionErrors.errors} />
		{/snippet}
	</Section.Heading>
	<Section.Body isLoading={sectionErrors.isLoading}>
		<Tooltip>
			<Tooltip.Trigger>
				<!-- One focus stop for both sides. Keyboard focus is the only way to open the tooltip without a pointer. -->
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<span
					role="group"
					aria-label="Gripper status"
					class="inline-flex items-center gap-px"
					tabindex="0"
				>
					<span class={['badge rounded-r-none', movingTone]}>{movingText}</span>
					<span class={['badge rounded-l-none', holdingTone]}>{holdingText}</span>
				</span>
			</Tooltip.Trigger>
			<Tooltip.Content>Updates automatically</Tooltip.Content>
		</Tooltip>
	</Section.Body>
</Section>
