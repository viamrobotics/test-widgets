<script lang="ts">
	import { ArmClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const MISSING_VALUE = '-'

	const client = createResourceClient(
		ArmClient,
		() => partID,
		() => resourceName
	)

	// The properties do not change while the arm runs, so they are read once.
	const query = createResourceQuery(client, 'getProperties', { refetchInterval: false })

	const yesNo = (supported: boolean | undefined) => {
		if (supported === undefined) return MISSING_VALUE
		return supported ? 'Yes' : 'No'
	}

	const idPrefix = $props.id()

	const rows = $derived([
		{ label: 'Manual mode', text: yesNo(query.data?.supportManualMode) },
		{ label: 'Cartesian commands', text: yesNo(query.data?.supportCartesianCommands) },
	])
</script>

<ApiSection
	method="GetProperties"
	api={ResourceTriplets.Arm}
	queries={[query]}
	class="min-w-0 grow flex-col gap-2"
>
	<div
		role="group"
		aria-label="Properties"
		class="flex flex-col gap-1"
	>
		{#each rows as row, index (row.label)}
			{@const rowLabelId = `${idPrefix}-${index}`}
			<div
				role="group"
				aria-labelledby={rowLabelId}
				class="flex min-w-0 items-center gap-2"
			>
				<span
					id={rowLabelId}
					class="text-subtle-1 w-36 shrink-0 text-xs">{row.label}</span
				>
				<span class="readout font-roboto-mono">
					<span class="readout-value">{row.text}</span>
				</span>
			</div>
		{/each}
	</div>
</ApiSection>
