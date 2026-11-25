<script lang="ts">
	import type { Snippet } from 'svelte'

	import { Label, Select } from '@viamrobotics/prime-core'

	interface Props {
		value: string
		options: string[]
		label: Snippet
		onChange: (value: string) => void
	}

	const { value, options, label, onChange }: Props = $props()
</script>

<Label>
	{@render label()}

	<Select
		slot="input"
		{value}
		on:change={(event) => {
			onChange((event.target as HTMLSelectElement).value)
		}}
	>
		<option value="">Select a frame…</option>
		{#each options as name (name)}
			<option value={name}>{name}</option>
		{/each}
	</Select>
</Label>
