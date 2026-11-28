<script lang="ts">
	import type { Snippet } from 'svelte'

	import { Select } from '@viamrobotics/prime-controls'

	interface Props {
		value: string
		options: string[]
		label: Snippet
		onChange: (value: string) => void
	}

	const { value, options, label, onChange }: Props = $props()

	const labelId = $props.id()

	const items = $derived(options.map((name) => ({ value: name, label: name })))
</script>

<div class="flex min-w-0 flex-col gap-1">
	<span
		id={labelId}
		class="text-subtle-1 text-xs"
	>
		{@render label()}
	</span>
	<Select
		{items}
		aria-labelledby={labelId}
		placeholder="Select a frame…"
		bind:value={() => value, onChange}
	/>
</div>
