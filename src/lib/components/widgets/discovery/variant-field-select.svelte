<script lang="ts">
	import type { JsonValue } from '@viamrobotics/sdk'

	import { Select } from '@viamrobotics/prime-controls'
	import { isEqual } from 'lodash-es'

	import type { VariantField } from './variant-fields'

	import { fieldValueLabel } from './field-value-label'

	interface Props {
		field: VariantField
		/** The selected variant's value for this field, undefined when the variant lacks it. */
		value: JsonValue | undefined
		onPick: (value: JsonValue) => void
	}

	const { field, value, onPick }: Props = $props()

	// prime-controls `Select` values are strings, so each item's value is its index in `field.values`.
	const items = $derived(
		field.values.map((fieldValue, index) => ({
			value: String(index),
			label: fieldValueLabel(fieldValue),
		}))
	)

	const selectedIndex = $derived(field.values.findIndex((fieldValue) => isEqual(fieldValue, value)))

	const getSelected = () => (selectedIndex === -1 ? '' : String(selectedIndex))

	const pick = (next: string | undefined) => {
		const picked = field.values[Number(next)]
		if (next === undefined || next === '' || picked === undefined) return
		onPick(picked)
	}

	const labelId = $props.id()
</script>

<div class="flex min-w-0 items-center gap-2">
	<span
		id={labelId}
		class="text-subtle-1 w-28 min-w-18 shrink truncate text-xs"
		title={field.key}
	>
		{field.key}
	</span>
	<div class="min-w-0 flex-1">
		<Select
			{items}
			bind:value={getSelected, pick}
			aria-labelledby={labelId}
			placeholder="-"
		/>
	</div>
</div>
