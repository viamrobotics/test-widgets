<script lang="ts">
	import type { FlatTensors, Metadata, MLModel, Resource } from '@viamrobotics/sdk'

	import { mdiPlayCircleOutline } from '@mdi/js'
	import { Folder, Select, TextField } from '@viamrobotics/prime-controls'
	import { CodeEditor } from '@viamrobotics/prime-editor'
	import { Icon } from '@viamrobotics/prime-ui'
	import { MLModelClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import CopyButton from '$lib/components/copy-button.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import { buildFlatTensors, type TensorInput } from './build-flat-tensors'
	import { describeDataError } from './describe-data-error'
	import { describeOutputTensors } from './describe-output-tensors'
	import { parseTensorData, parseTensorShape } from './parse-tensor-input'
	import {
		DEFAULT_TENSOR_DATA_TYPE,
		isTensorDataType,
		TENSOR_DATA_TYPES,
		type TensorDataType,
	} from './tensor-data-type'

	interface Props {
		partID: string
		resourceName: string
	}

	interface TensorDraft {
		draftId: number
		name: string
		/** True for a tensor Metadata lists, whose name is its Folder title. */
		isNameFixed: boolean
		/** True for a draft Add tensor made, the only kind Remove applies to. */
		isRemovable: boolean
		dataType: TensorDataType
		shapeText: string
		dataText: string
	}

	const { partID, resourceName }: Props = $props()

	const JSON_INDENT = 2
	const FIRST_SEEDED_DRAFT_ID = -1
	const DATA_TYPE_ITEMS = TENSOR_DATA_TYPES.map((dataType) => ({
		value: dataType,
		label: dataType,
	}))

	// The SDK's ML model client has no `doCommand`, so it is not a `Resource`. This names the one
	// method the mutation calls, so its argument is typed as `FlatTensors`.
	interface InferableResource extends Resource {
		infer: MLModel['infer']
	}

	const client = createResourceClient<InferableResource>(
		// @ts-expect-error No resource type overlap
		MLModelClient,
		() => partID,
		() => resourceName
	)

	// @ts-expect-error No resource overlap
	const metadataQuery = createResourceQuery(client, 'metadata', () => ({ refetchInterval: false }))
	const inferMutation = createResourceMutation(client, 'infer')

	const idPrefix = $props.id()
	let nextDraftId = 0
	const newTensor = (overrides: Partial<TensorDraft> = {}): TensorDraft => ({
		draftId: nextDraftId++,
		name: '',
		isNameFixed: false,
		isRemovable: false,
		dataType: DEFAULT_TENSOR_DATA_TYPE,
		shapeText: '',
		dataText: '',
		...overrides,
	})

	const isMetadataResponse = (value: unknown): value is { metadata?: Metadata } =>
		typeof value === 'object' && value !== null && 'metadata' in value

	const metadata = $derived.by((): Metadata | undefined => {
		const response: unknown = metadataQuery.data
		return isMetadataResponse(response) ? response.metadata : undefined
	})

	// Metadata's inputs are the drafts until the first edit, add, or remove. That edit copies them
	// into `editedTensors`, which then wins, so a Metadata refetch never overwrites a draft.
	// Seeded ids are negative, so they never meet the ids `newTensor` hands out.
	const seededTensors = $derived.by((): TensorDraft[] => {
		const inputInfo = metadata?.inputInfo ?? []
		if (inputInfo.length === 0) return [newTensor({ draftId: FIRST_SEEDED_DRAFT_ID })]
		return inputInfo.map((info, index) => ({
			draftId: FIRST_SEEDED_DRAFT_ID - index,
			name: info.name,
			isNameFixed: info.name !== '',
			isRemovable: false,
			dataType: isTensorDataType(info.dataType) ? info.dataType : DEFAULT_TENSOR_DATA_TYPE,
			shapeText: info.shape.join(', '),
			dataText: '',
		}))
	})
	let editedTensors = $state<TensorDraft[] | undefined>()
	const tensors = $derived(editedTensors ?? seededTensors)

	const updateDraft = (draftId: number, patch: Partial<TensorDraft>) => {
		const current = tensors.find((draft) => draft.draftId === draftId)
		if (current === undefined) return
		const isChange = Object.entries(patch).some(([key, value]) => {
			const field = Object.entries(current).find(([name]) => name === key)
			return field?.[1] !== value
		})
		if (!isChange) return
		editedTensors = tensors.map((draft) =>
			draft.draftId === draftId ? { ...draft, ...patch } : draft
		)
	}

	const tensorTitle = (draft: TensorDraft, index: number): string =>
		draft.name.trim() === '' ? `Input ${index + 1}` : draft.name.trim()

	const isBlank = (text: string): boolean => text.trim() === ''

	const hasDuplicateName = (draft: TensorDraft): boolean =>
		!isBlank(draft.name) &&
		tensors.some(
			(other) => other.draftId !== draft.draftId && other.name.trim() === draft.name.trim()
		)

	const isDraftIncomplete = (draft: TensorDraft): boolean =>
		isBlank(draft.name) || isBlank(draft.shapeText) || isBlank(draft.dataText)

	const NAME_DUPLICATE_MESSAGE = 'Give each input tensor a different name.'
	const INCOMPLETE_HINT = 'Enter a name, shape, and data for each tensor to execute.'
	const SHAPE_MESSAGE = 'Enter Shape as whole numbers separated by commas.'

	const nameMessage = (draft: TensorDraft): string | undefined =>
		hasDuplicateName(draft) ? NAME_DUPLICATE_MESSAGE : undefined
	const shapeMessage = (draft: TensorDraft): string | undefined => {
		if (isBlank(draft.shapeText)) return undefined
		return parseTensorShape(draft.shapeText) === undefined ? SHAPE_MESSAGE : undefined
	}
	const dataMessage = (draft: TensorDraft): string | undefined => {
		if (isBlank(draft.dataText)) return undefined
		return describeDataError(draft.dataText, draft.dataType, draft.shapeText)
	}

	const messageId = (draft: TensorDraft, field: string): string =>
		`${idPrefix}-${field}-${draft.draftId}-message`

	const firstProblem = $derived.by((): { id: string; text: string } | undefined => {
		for (const draft of tensors) {
			const problems = [
				{ field: 'name', text: nameMessage(draft) },
				{ field: 'shape', text: shapeMessage(draft) },
				{ field: 'data', text: dataMessage(draft) },
			]
			const problem = problems.find((candidate) => candidate.text !== undefined)
			if (problem?.text !== undefined) {
				return { id: messageId(draft, problem.field), text: problem.text }
			}
		}
		return undefined
	})
	const isAnyDraftIncomplete = $derived(tensors.some((draft) => isDraftIncomplete(draft)))
	const isHintShown = $derived(firstProblem === undefined && isAnyDraftIncomplete)
	const incompleteHintId = `${idPrefix}-incomplete-hint`
	const executeDescriptionId = $derived(isHintShown ? incompleteHintId : firstProblem?.id)
	const canExecute = $derived(
		firstProblem === undefined && !isAnyDraftIncomplete && !inferMutation.isPending
	)

	const toTensorInput = (draft: TensorDraft): TensorInput | undefined => {
		const shape = parseTensorShape(draft.shapeText)
		const values = parseTensorData(draft.dataText, draft.dataType)
		if (shape === undefined || values === undefined) return undefined
		return { name: draft.name.trim(), dataType: draft.dataType, shape, values }
	}

	const execute = () => {
		if (!canExecute) return
		const inputs = tensors.map((draft) => toTensorInput(draft))
		const readyInputs = inputs.filter((input) => input !== undefined)
		if (readyInputs.length !== inputs.length) return
		inferMutation.mutate([buildFlatTensors(readyInputs)])
	}

	const addTensor = () => {
		editedTensors = [...tensors, newTensor({ isRemovable: true })]
	}

	const removeTensor = (draftId: number) => {
		editedTensors = tensors.filter((draft) => draft.draftId !== draftId)
	}

	const isInferResponse = (value: unknown): value is { outputTensors?: FlatTensors } =>
		typeof value === 'object' && value !== null && 'outputTensors' in value

	const outputRows = $derived.by(() => {
		const response: unknown = inferMutation.data
		if (!isInferResponse(response)) return []
		return describeOutputTensors(response.outputTensors)
	})

	const outputJson = $derived(
		JSON.stringify(
			Object.fromEntries(outputRows.map((row) => [row.name, row.summary])),
			undefined,
			JSON_INDENT
		)
	)
</script>

{#snippet readout(label: string, value: string)}
	<div
		role="group"
		aria-label={label}
		class="flex min-w-0 items-start gap-2"
	>
		<span class="text-subtle-1 w-24 shrink-0 truncate text-xs">{label}</span>
		<span class="readout font-roboto-mono min-w-0">
			<span class="readout-value wrap-anywhere whitespace-normal">{value}</span>
		</span>
	</div>
{/snippet}

{#snippet fieldMessage(id: string, message: string | undefined)}
	{#if message !== undefined}
		<span
			{id}
			class="text-subtle-1 text-xs">{message}</span
		>
	{/if}
{/snippet}

<ApiSection
	method="Infer"
	api={ResourceTriplets.MLModel}
	mutations={[inferMutation]}
	class="flex-col gap-2"
>
	<div class="flex min-w-0 flex-col gap-2">
		{#each tensors as draft, index (draft.draftId)}
			{@const dataLabelId = `${idPrefix}-data-${draft.draftId}`}
			{@const typeLabelId = `${idPrefix}-type-${draft.draftId}`}
			{@const message = nameMessage(draft)}
			{@const shapeError = shapeMessage(draft)}
			{@const dataError = dataMessage(draft)}
			<Folder title={tensorTitle(draft, index)}>
				<div class="flex min-w-0 flex-col gap-2">
					{#if !draft.isNameFixed || hasDuplicateName(draft)}
						<TextField
							label="Name"
							state={message === undefined ? undefined : 'error'}
							aria-describedby={message === undefined ? undefined : messageId(draft, 'name')}
							bind:value={
								() => draft.name,
								(next) => updateDraft(draft.draftId, { name: next, isNameFixed: false })
							}
						/>
						{@render fieldMessage(messageId(draft, 'name'), message)}
					{/if}
					<div class="flex flex-col gap-1">
						<span
							id={typeLabelId}
							class="text-subtle-1 text-xs">Data type</span
						>
						<Select
							items={DATA_TYPE_ITEMS}
							aria-labelledby={typeLabelId}
							bind:value={
								() => draft.dataType,
								(next) => {
									if (isTensorDataType(next)) updateDraft(draft.draftId, { dataType: next })
								}
							}
						/>
					</div>
					<TextField
						label="Shape"
						placeholder="1, 224, 224, 3"
						state={shapeError === undefined ? undefined : 'error'}
						aria-describedby={shapeError === undefined ? undefined : messageId(draft, 'shape')}
						bind:value={
							() => draft.shapeText, (next) => updateDraft(draft.draftId, { shapeText: next })
						}
					/>
					{@render fieldMessage(messageId(draft, 'shape'), shapeError)}
					<div class="flex flex-col gap-1">
						<span
							id={dataLabelId}
							class="text-subtle-1 text-xs">Data</span
						>
						<CodeEditor
							language="json"
							aria-labelledby={dataLabelId}
							aria-invalid={dataError !== undefined}
							aria-describedby={dataError === undefined ? undefined : messageId(draft, 'data')}
							class="h-32 overflow-y-auto"
							bind:value={
								() => draft.dataText, (next) => updateDraft(draft.draftId, { dataText: next })
							}
						/>
						{@render fieldMessage(messageId(draft, 'data'), dataError)}
					</div>
					{#if draft.isRemovable}
						<button
							type="button"
							class="button button-compact self-start"
							aria-label={`Remove ${tensorTitle(draft, index)}`}
							onclick={() => removeTensor(draft.draftId)}
						>
							Remove
						</button>
					{/if}
				</div>
			</Folder>
		{/each}
	</div>

	<div class="flex flex-wrap items-center justify-between gap-2">
		<button
			type="button"
			class="button button-compact"
			onclick={addTensor}
		>
			Add tensor
		</button>
		<button
			type="button"
			class="button button-compact"
			disabled={!canExecute}
			aria-describedby={executeDescriptionId}
			onclick={execute}
		>
			<Icon icon={mdiPlayCircleOutline} />
			Execute
		</button>
	</div>
	{#if isHintShown}
		<p
			id={incompleteHintId}
			class="text-subtle-1 text-xs"
		>
			{INCOMPLETE_HINT}
		</p>
	{/if}

	{#if outputRows.length > 0}
		<div class="flex min-w-0 flex-col gap-2">
			<div class="flex items-center justify-between gap-2">
				<h4 class="text-xs font-semibold">Output</h4>
				<CopyButton
					data={outputJson}
					ariaLabel="Copy JSON"
				/>
			</div>
			{#each outputRows as row (row.name)}
				<Folder title={row.name}>
					<div class="flex min-w-0 flex-col gap-1">
						{@render readout('Data type', row.dataType)}
						{@render readout('Shape', row.shape)}
						{@render readout('First 8 values', row.preview)}
					</div>
				</Folder>
			{/each}
		</div>
	{/if}
</ApiSection>
