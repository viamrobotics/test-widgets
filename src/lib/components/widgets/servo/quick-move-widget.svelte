<script lang="ts">
	import { ServoClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import { Section } from '$lib/components/section'
	import { useSectionErrors } from '$lib/components/section/use-section-errors.svelte'

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
	const quickMoveMutation = createResourceMutation(client, 'move')

	const quickMoveErrors = useSectionErrors(() => ({
		queries: [positionQuery],
		mutations: [quickMoveMutation],
	}))

	const quickMoveTo = (angle: number) => {
		quickMoveMutation.mutate([angle], {})
	}
</script>

<Section
	errorReporter={quickMoveErrors}
	class="grow flex-col gap-4"
>
	<div class="flex flex-col gap-0.5">
		<Section.Heading>
			Quick move
			{#snippet aside()}
				<Section.Errors errors={quickMoveErrors.errors} />
			{/snippet}
		</Section.Heading>
	</div>
	<Section.Body isLoading={quickMoveErrors.isLoading}>
		{#if positionQuery.data !== undefined}
			<QuickMove
				currentPosition={positionQuery.data}
				moveTo={quickMoveTo}
			/>
		{/if}
		<Section.Text class="mt-auto">Press a button to execute</Section.Text>
	</Section.Body>
</Section>
