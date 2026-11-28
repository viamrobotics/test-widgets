<script lang="ts">
	import type { appRobotApi, JsonValue } from '@viamrobotics/sdk'
	import type { Snippet } from 'svelte'

	import { mdiContentCopy, mdiPlus } from '@mdi/js'
	import { Panel } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'

	import type { DiscoveredResource } from './group-discoveries'

	import { fieldValueLabel } from './field-value-label'
	import { pickVariant } from './pick-variant'
	import { transformComponentConfig } from './transform-component-config'
	import { variantAttributes, variantFields } from './variant-fields'
	import VariantFieldSelect from './VariantFieldSelect.svelte'

	interface Props {
		resource: DiscoveredResource
		/** Index into `resource.variants` of the variant the controls select. */
		selectedIndex: number
		onSelect: (index: number) => void
		/** Writes text to the clipboard. The control reports a failure to its indicator. */
		onCopy: (text: string) => void
		/** A handler for adding a component to the robot. Without it the block offers only the copies. */
		onAddComponent?: ((component: appRobotApi.ComponentConfig) => void) | undefined
		/** The host's preview of the selected variant, under the API and model. */
		preview?: Snippet<[appRobotApi.ComponentConfig]> | undefined
	}

	const { resource, selectedIndex, onSelect, onCopy, onAddComponent, preview }: Props = $props()

	const JSON_INDENT = 2

	const variant = $derived(resource.variants[selectedIndex] ?? resource.variants[0])
	const selectedAttributes = $derived<Record<string, JsonValue>>(
		variant === undefined ? {} : variantAttributes(variant)
	)
	const hasVariants = $derived(resource.variants.length > 1)

	const sortedFields = $derived(
		variantFields(resource).toSorted((first, second) => first.key.localeCompare(second.key))
	)
	const controlFields = $derived(sortedFields.filter((field) => field.isControl))
	const fixedFields = $derived(sortedFields.filter((field) => !field.isControl))

	const pick = (key: string, value: JsonValue) => {
		onSelect(pickVariant(resource, selectedIndex, key, value))
	}

	const addToConfig = () => {
		if (variant === undefined) return
		onAddComponent?.(transformComponentConfig(variant))
	}

	const copyResource = () => {
		if (variant === undefined) return
		onCopy(JSON.stringify(transformComponentConfig(variant).toJson(), null, JSON_INDENT))
	}

	const copyAttributes = () => {
		onCopy(JSON.stringify(variant?.attributes?.toJson() ?? {}, null, JSON_INDENT))
	}

	const titleId = $props.id()
</script>

{#snippet readout(label: string, text: string)}
	<div
		role="group"
		aria-label={label}
		class="flex min-w-0 items-center gap-2"
	>
		<span
			class="text-subtle-1 w-28 min-w-18 shrink truncate text-xs"
			title={label}
		>
			{label}
		</span>
		<span class="readout font-roboto-mono min-w-0 flex-1">
			<span
				class="readout-value truncate"
				title={text}
			>
				{text}
			</span>
		</span>
	</div>
{/snippet}

<Panel
	aria-labelledby={titleId}
	class="min-w-0 gap-2"
>
	<div class="flex min-w-0 items-center gap-2">
		<span
			id={titleId}
			class="min-w-0 flex-1 truncate text-xs font-semibold"
			title={resource.name}
		>
			{resource.name}
		</span>
		{#if hasVariants}
			<span class="badge badge-neutral shrink-0">{resource.variants.length} variants</span>
		{/if}
	</div>

	<div class="flex flex-col gap-0.5">
		<span class="text-subtle-1 font-roboto-mono text-xs wrap-anywhere">{resource.api}</span>
		<span class="text-subtle-1 font-roboto-mono text-xs wrap-anywhere">{resource.model}</span>
	</div>

	{#if preview && variant}
		{@render preview(variant)}
	{/if}

	{#each controlFields as field (field.key)}
		<VariantFieldSelect
			{field}
			value={selectedAttributes[field.key]}
			onPick={(value) => {
				pick(field.key, value)
			}}
		/>
	{/each}

	{#if hasVariants && variant}
		{@render readout('name', variant.name)}
	{/if}

	{#each fixedFields as field (field.key)}
		{@render readout(field.key, fieldValueLabel(field.values[0]))}
	{/each}

	<div class="mt-1 flex flex-col items-start gap-2">
		{#if onAddComponent}
			<button
				type="button"
				class="button button-dark button-compact"
				onclick={addToConfig}
			>
				<Icon icon={mdiPlus} />
				Add to config
			</button>
		{/if}
		<div class="flex flex-wrap gap-2">
			<button
				type="button"
				class="button button-compact"
				onclick={copyResource}
			>
				<Icon icon={mdiContentCopy} />
				Copy resource
			</button>
			<button
				type="button"
				class="button button-compact"
				onclick={copyAttributes}
			>
				<Icon icon={mdiContentCopy} />
				Copy attributes
			</button>
		</div>
	</div>
</Panel>
