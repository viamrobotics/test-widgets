<script lang="ts">
	import type { Metadata, TensorInfo } from '@viamrobotics/sdk'

	import { Folder } from '@viamrobotics/prime-controls'
	import { MLModelClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	interface Props {
		partID: string
		resourceName: string
	}

	interface Row {
		label: string
		value: string
		doesWrap?: boolean
	}

	const { partID, resourceName }: Props = $props()

	const MISSING_VALUE = '-'
	const LABEL_TYPE_TENSOR_VALUE = 1
	const LABEL_TYPE_TENSOR_AXIS = 2

	const client = createResourceClient(
		// @ts-expect-error No resource type overlap
		MLModelClient,
		() => partID,
		() => resourceName
	)

	// A model's metadata does not change while it runs, so it is read once.
	// @ts-expect-error No resource overlap
	const metadataQuery = createResourceQuery(client, 'metadata', () => ({ refetchInterval: false }))

	const isMetadataResponse = (value: unknown): value is { metadata?: Metadata } =>
		typeof value === 'object' && value !== null && 'metadata' in value

	const metadata = $derived.by((): Metadata | undefined => {
		const data: unknown = metadataQuery.data
		return isMetadataResponse(data) ? data.metadata : undefined
	})

	const textOrMissing = (text: string | undefined): string =>
		text === undefined || text === '' ? MISSING_VALUE : text

	const shapeText = (shape: number[]): string =>
		shape.length === 0 ? MISSING_VALUE : shape.join(' × ')

	const labelTypeText = (labelType: number): string => {
		switch (labelType) {
			case LABEL_TYPE_TENSOR_VALUE: {
				return 'Tensor value'
			}
			case LABEL_TYPE_TENSOR_AXIS: {
				return 'Tensor axis'
			}
			default: {
				return 'Unspecified'
			}
		}
	}

	const tensorTitle = (tensor: TensorInfo, kind: string, index: number): string =>
		tensor.name === '' ? `${kind} ${index + 1}` : tensor.name

	const modelRows = $derived<Row[]>([
		{ label: 'Name', value: textOrMissing(metadata?.name) },
		{ label: 'Type', value: textOrMissing(metadata?.type) },
		{ label: 'Description', value: textOrMissing(metadata?.description), doesWrap: true },
	])

	const tensorRows = (tensor: TensorInfo): Row[] => [
		{ label: 'Data type', value: textOrMissing(tensor.dataType) },
		{ label: 'Shape', value: shapeText(tensor.shape) },
		{ label: 'Description', value: textOrMissing(tensor.description), doesWrap: true },
	]

	const groups = $derived([
		{ label: 'Inputs', kind: 'Input', tensors: metadata?.inputInfo ?? [] },
		{ label: 'Outputs', kind: 'Output', tensors: metadata?.outputInfo ?? [] },
	])
</script>

{#snippet readout(row: Row)}
	<div
		role="group"
		aria-label={row.label}
		class="flex min-w-0 items-start gap-2"
	>
		<span class="text-subtle-1 w-24 shrink-0 truncate text-xs">{row.label}</span>
		<span class="readout font-roboto-mono min-w-0">
			<span class={['readout-value', row.doesWrap && 'wrap-anywhere whitespace-normal']}>
				{row.value}
			</span>
		</span>
	</div>
{/snippet}

<ApiSection
	method="Metadata"
	api={ResourceTriplets.MLModel}
	queries={[metadataQuery]}
	class="grow flex-col gap-2"
>
	<div class="flex min-w-0 flex-col gap-1">
		{#each modelRows as row (row.label)}
			{@render readout(row)}
		{/each}
	</div>

	{#each groups as group (group.label)}
		<h4 class="text-xs font-semibold">{group.label}</h4>
		{#if group.tensors.length === 0}
			<p class="text-subtle-2 text-xs">None</p>
		{/if}
		<div class="flex min-w-0 flex-col gap-2">
			{#each group.tensors as tensor, index (index)}
				<Folder title={tensorTitle(tensor, group.kind, index)}>
					<div class="flex min-w-0 flex-col gap-1">
						{#each tensorRows(tensor) as row (row.label)}
							{@render readout(row)}
						{/each}
						{#each tensor.associatedFiles as file, fileIndex (fileIndex)}
							<p class="text-subtle-2 text-xs wrap-anywhere">
								{file.name}
								· {labelTypeText(file.labelType)}
							</p>
						{/each}
					</div>
				</Folder>
			{/each}
		</div>
	{/each}
</ApiSection>
