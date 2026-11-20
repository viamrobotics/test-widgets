<script lang="ts">
	import { TextField } from '@viamrobotics/prime-controls'

	interface Props {
		value: string
	}

	let { value = $bindable() }: Props = $props()

	const PIN_PLACEHOLDER = '11'
	const HINT = 'Used by the seven pin widgets. Analog reader and interrupt widgets keep their own.'

	const hintId = $props.id()
</script>

<div
	role="group"
	aria-label="Shared pin"
	class="flex flex-col gap-1 p-2"
>
	<TextField
		class="max-w-40"
		label="Pin"
		placeholder={PIN_PLACEHOLDER}
		aria-describedby={hintId}
		bind:value
	/>
	<p
		id={hintId}
		class="text-subtle-2 text-xs"
	>
		{HINT}
	</p>
</div>
