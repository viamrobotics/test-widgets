<script lang="ts">
	import { MotorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import { Section } from '$lib/components/section'
	import { useSectionErrors } from '$lib/components/section/use-section-errors.svelte'

	import QuickMove from './quick-move.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		MotorClient,
		() => partID,
		() => resourceName
	)

	const quickSetPowerMutation = createResourceMutation(client, 'setPower')

	const quickMoveErrors = useSectionErrors(() => ({ mutations: [quickSetPowerMutation] }))
</script>

<Section
	errorReporter={quickMoveErrors}
	class="flex-row flex-wrap gap-2"
>
	<div class="flex flex-col gap-0.5">
		<Section.Heading>
			Quick move
			{#snippet aside()}
				<Section.Errors errors={quickMoveErrors.errors} />
			{/snippet}
		</Section.Heading>
	</div>
	<Section.Body>
		<div class="flex grow flex-wrap justify-between gap-2">
			<QuickMove
				setPower={(val) => {
					quickSetPowerMutation.mutate([val], {})
				}}
			/>
		</div>
	</Section.Body>
</Section>
