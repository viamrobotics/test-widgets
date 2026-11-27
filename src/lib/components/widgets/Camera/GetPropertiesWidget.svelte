<script lang="ts">
	import { CameraClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const MISSING_VALUE = '-'

	const client = createResourceClient(
		CameraClient,
		() => partID,
		() => resourceName
	)

	// The properties do not change while the camera runs, so they are read once.
	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: false })

	const properties = $derived(propertiesQuery.data)
	const intrinsics = $derived(properties?.intrinsicParameters)
	const distortion = $derived(properties?.distortionParameters)

	const numberText = (value: number | undefined) =>
		value === undefined ? MISSING_VALUE : String(value)

	const mimeTypesText = $derived(
		properties === undefined || properties.mimeTypes.length === 0
			? MISSING_VALUE
			: properties.mimeTypes.join(', ')
	)

	const intrinsicReadouts = $derived([
		{ label: 'Width', value: intrinsics?.widthPx },
		{ label: 'Height', value: intrinsics?.heightPx },
		{ label: 'Focal X', value: intrinsics?.focalXPx },
		{ label: 'Focal Y', value: intrinsics?.focalYPx },
		{ label: 'Center X', value: intrinsics?.centerXPx },
		{ label: 'Center Y', value: intrinsics?.centerYPx },
	])

	const distortionParameters = $derived(
		distortion === undefined || distortion.parameters.length === 0
			? [undefined]
			: distortion.parameters
	)

	const distortionModelText = $derived(
		distortion === undefined || distortion.model === '' ? MISSING_VALUE : distortion.model
	)

	const supportsPcdText = $derived.by(() => {
		if (properties === undefined) return MISSING_VALUE
		return properties.supportsPcd ? 'Yes' : 'No'
	})
</script>

{#snippet rowLabel(text: string)}
	<span class="text-subtle-1 w-31 shrink-0 truncate text-xs">
		{text}
	</span>
{/snippet}

{#snippet cell(text: string, label: string, suffix?: string)}
	<div class="flex min-w-0 flex-col gap-0.5">
		<span class="text-subtle-1 truncate text-xs">{label}</span>
		<span class="readout font-roboto-mono">
			<span class="readout-value">{text}</span>
			{#if suffix !== undefined && text !== MISSING_VALUE}
				<span class="readout-suffix">{suffix}</span>
			{/if}
		</span>
	</div>
{/snippet}

<ApiSection
	method="GetProperties"
	api={ResourceTriplets.Camera}
	queries={[propertiesQuery]}
	class="grow flex-col gap-2"
>
	<div
		role="group"
		aria-label="Properties"
		class="flex flex-col gap-1"
	>
		<div class="flex min-w-0 items-center gap-2">
			{@render rowLabel('Supports point cloud')}
			<span class="readout font-roboto-mono inline-flex items-center gap-2">
				{#if properties !== undefined}
					<span
						role="img"
						aria-label="Supports point cloud"
						class={[
							'size-2 rounded-full',
							properties.supportsPcd ? 'bg-success-dark' : 'bg-disabled',
						]}
					></span>
				{/if}
				<span class="readout-value">{supportsPcdText}</span>
			</span>
		</div>
		<div class="flex min-w-0 items-center gap-2">
			{@render rowLabel('Frame rate')}
			<span class="readout font-roboto-mono">
				<span class="readout-value">{numberText(properties?.frameRate)}</span>
				{#if properties?.frameRate !== undefined}
					<span class="readout-suffix">fps</span>
				{/if}
			</span>
		</div>
	</div>

	<p class="text-subtle-2 text-xs">MIME types: {mimeTypesText}</p>

	<h4 class="text-xs font-semibold">Intrinsics</h4>
	<div
		role="group"
		aria-label="Intrinsics"
		class="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-x-1 gap-y-2"
	>
		{#each intrinsicReadouts as readout (readout.label)}
			{@render cell(numberText(readout.value), readout.label, 'px')}
		{/each}
	</div>

	<h4 class="text-xs font-semibold">Distortion</h4>
	<div
		role="group"
		aria-label="Distortion model"
		class="flex min-w-0 items-center gap-2"
	>
		<span class="text-subtle-1 w-31 shrink-0 truncate text-xs">Model</span>
		<span class="readout font-roboto-mono">
			<span class="readout-value">{distortionModelText}</span>
		</span>
	</div>
	<div
		role="group"
		aria-label="Distortion parameters"
		class="grid grid-cols-[repeat(auto-fill,minmax(3rem,1fr))] gap-x-1 gap-y-2"
	>
		{#each distortionParameters as parameter, index (index)}
			{@render cell(numberText(parameter), String(index + 1))}
		{/each}
	</div>
</ApiSection>
