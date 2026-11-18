<script lang="ts">
	import { ServoClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { Section } from '$lib/components/section'
	import { ResourceTriplets } from '$lib/resource-triplet'

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

	const MISSING_VALUE = '-'

	const positionText = $derived(
		positionQuery.data === undefined ? MISSING_VALUE : String(Math.round(positionQuery.data))
	)

	const labelId = $props.id()
</script>

<ApiSection
	class="grow flex-col gap-4"
	method="GetPosition"
	api={ResourceTriplets.Servo}
	queries={[positionQuery]}
>
	<div class="flex min-w-0 items-center gap-2">
		<span
			id={labelId}
			class="text-subtle-1 w-14 shrink-0 text-xs"
		>
			Position
		</span>
		<span
			role="group"
			aria-labelledby={labelId}
			class="readout font-roboto-mono"
		>
			<span class="readout-value">{positionText}</span>
			<span class="readout-suffix">°</span>
		</span>
	</div>
	<Section.Text class="mt-auto">Updates automatically</Section.Text>
</ApiSection>
