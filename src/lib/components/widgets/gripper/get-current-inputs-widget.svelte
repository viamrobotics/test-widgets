<script lang="ts">
	import { GripperClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { Section } from '$lib/components/section'
	import { formatNumeric } from '$lib/format'
	import { ResourceTriplets } from '$lib/resource-triplet'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const MISSING_VALUE = '-'

	const client = createResourceClient(
		GripperClient,
		() => partID,
		() => resourceName
	)

	const currentInputsQuery = createResourceQuery(client, 'getCurrentInputs', {
		refetchInterval: 500,
	})

	const inputs = $derived(currentInputsQuery.data ?? [])
	const hasInputs = $derived(inputs.length > 0)

	const idPrefix = $props.id()
	const labelId = `${idPrefix}-heading`
</script>

<ApiSection
	method="GetCurrentInputs"
	api={ResourceTriplets.Gripper}
	queries={[currentInputsQuery]}
	class="min-w-0 grow flex-col gap-4"
>
	<div
		role="group"
		aria-labelledby={labelId}
		class="flex flex-col gap-1"
	>
		<span
			id={labelId}
			class="sr-only">Current inputs</span
		>
		{#if hasInputs}
			<!-- inputs are just the index in the list of values, we need to use index for the key -->
			{#each inputs as input, index (index)}
				{@const inputLabelId = `${idPrefix}-input-${index}`}
				<div
					role="group"
					aria-labelledby={inputLabelId}
					class="flex min-w-0 items-center gap-2"
				>
					<span
						id={inputLabelId}
						class="text-subtle-1 w-14 shrink-0 text-xs">Input {index}</span
					>
					<span class="readout font-roboto-mono">
						<span class="readout-value">{formatNumeric(input)}</span>
					</span>
				</div>
			{/each}
		{:else}
			<div
				role="group"
				aria-labelledby="{idPrefix}-empty"
				class="flex min-w-0 items-center gap-2"
			>
				<span
					id="{idPrefix}-empty"
					class="text-subtle-1 w-14 shrink-0 text-xs">Inputs</span
				>
				<span class="readout font-roboto-mono">
					<span class="readout-value">{MISSING_VALUE}</span>
				</span>
			</div>
		{/if}
	</div>
	<div class="mt-auto flex flex-col gap-1">
		<Section.Text>Units come from the gripper's kinematics</Section.Text>
		<Section.Text>Updates automatically</Section.Text>
	</div>
</ApiSection>
