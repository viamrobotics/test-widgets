<script lang="ts">
	import { SwitchClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { Section } from '#lib/components/Section/index.js'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const MISSING_VALUE = '-'

	const client = createResourceClient(
		SwitchClient,
		() => partID,
		() => resourceName
	)

	const positionQuery = createResourceQuery(client, 'getPosition', {
		refetchInterval: 500,
	})

	const positionIndex = $derived(positionQuery.data ?? MISSING_VALUE)

	const labelId = $props.id()
</script>

<ApiSection
	method="GetPosition"
	api={ResourceTriplets.Switch}
	class="grow flex-col gap-2"
	queries={[positionQuery]}
>
	<div class="flex min-w-0 items-center gap-2">
		<span
			id={labelId}
			class="text-subtle-1 shrink-0 text-xs">Position</span
		>
		<span
			role="group"
			class="readout font-roboto-mono"
			aria-labelledby={labelId}
		>
			<span class="readout-value">{positionIndex}</span>
		</span>
	</div>
	<Section.Text>Updates automatically</Section.Text>
</ApiSection>
