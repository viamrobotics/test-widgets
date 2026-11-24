<script lang="ts">
	import { GantryClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'
	import { Section } from '#lib/components/section/index.js'
	import { useSectionErrors } from '#lib/components/section/use-section-errors.svelte.js'

	import QuickMove from './quick-move.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		GantryClient,
		() => partID,
		() => resourceName
	)

	const positionQuery = createResourceQuery(client, 'getPosition', {
		refetchInterval: 500,
	})

	const quickMoveMutation = createResourceMutation(client, 'moveToPosition')

	const quickMoveErrors = useSectionErrors(() => ({
		queries: [positionQuery],
		mutations: [quickMoveMutation],
	}))
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
				positions={positionQuery.data}
				moveTo={(newPos: number[], speeds: number[]) => {
					quickMoveMutation.mutate([newPos, speeds], {})
				}}
			/>
		{/if}
		<Section.Text class="mt-auto">Press a button to execute</Section.Text>
	</Section.Body>
</Section>
