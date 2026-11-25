<script lang="ts">
	import { ArmClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import CopyButton from '#lib/components/CopyButton.svelte'
	import { Section } from '#lib/components/Section/index.js'
	import { formatNumeric } from '#lib/format.js'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

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

	const query = createResourceQuery(client, 'getEndPosition', { refetchInterval: 500 })

	const pose = $derived(query.data)

	const readouts = $derived([
		{ label: 'X', value: pose?.x, suffix: 'mm' },
		{ label: 'Y', value: pose?.y, suffix: 'mm' },
		{ label: 'Z', value: pose?.z, suffix: 'mm' },
		{ label: 'OX', value: pose?.oX, suffix: '°' },
		{ label: 'OY', value: pose?.oY, suffix: '°' },
		{ label: 'OZ', value: pose?.oZ, suffix: '°' },
		{ label: 'Theta', value: pose?.theta, suffix: '°' },
	])

	const labelId = $props.id()

	const copyData = $derived(
		pose
			? JSON.stringify({
					x: pose.x,
					y: pose.y,
					z: pose.z,
					oX: pose.oX,
					oY: pose.oY,
					oZ: pose.oZ,
					theta: pose.theta,
				})
			: ''
	)
</script>

<ApiSection
	method="GetEndPosition"
	api={ResourceTriplets.Arm}
	queries={[query]}
	class="min-w-0 grow flex-col gap-4"
>
	<div class="flex min-w-0 flex-col gap-3">
		<div class="flex items-center gap-1">
			<span
				id={labelId}
				class="text-subtle-1 min-w-0 flex-1 truncate text-xs"
			>
				Current Position
			</span>
			{#if pose}
				<CopyButton data={copyData} />
			{/if}
		</div>

		<div
			role="group"
			aria-labelledby={labelId}
			class="flex flex-col gap-1"
		>
			{#each readouts as readout (readout.label)}
				{@const rowLabelId = `${labelId}-${readout.label}`}
				<div
					role="group"
					aria-labelledby={rowLabelId}
					class="flex min-w-0 items-center gap-2"
				>
					<span
						id={rowLabelId}
						class="text-subtle-1 w-14 shrink-0 text-xs">{readout.label}</span
					>
					<span class="readout font-roboto-mono">
						<span class="readout-value"
							>{readout.value === undefined ? MISSING_VALUE : formatNumeric(readout.value)}</span
						>
						{#if readout.value !== undefined}
							<span class="readout-suffix">{readout.suffix}</span>
						{/if}
					</span>
				</div>
			{/each}
		</div>
	</div>
	<Section.Text class="mt-auto">Updates automatically</Section.Text>
</ApiSection>
