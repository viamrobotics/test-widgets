<script lang="ts">
	import { Label, Select } from '@viamrobotics/prime-core'

	interface Props {
		value: string
		options: string[]
		label?: string
		onChange: (value: string) => void
	}

	const { value, options, label = 'Component', onChange }: Props = $props()
</script>

<Label>
	{label}

	<Select
		slot="input"
		{value}
		on:change={(event) => {
			onChange((event.target as HTMLSelectElement).value)
		}}
	>
		<option value="">Select a component…</option>
		{#each options as name (name)}
			<option value={name}>{name}</option>
		{/each}
	</Select>
</Label>
