<!--
@component
A board control's add field: a name field and Add. The draft clears once `onAdd` accepts it, and
stays when `onAdd` rejects it.
-->
<script lang="ts">
	import { TextField } from '@viamrobotics/prime-controls'

	interface Props {
		label: string
		placeholder: string
		/** The Add button's accessible name, such as "Add pin". */
		addLabel: string
		/** Returns whether the name was added. */
		onAdd: (draft: string) => boolean
	}

	const { label, placeholder, addLabel, onAdd }: Props = $props()

	let draft = $state('')
</script>

<form
	class="flex flex-wrap items-center gap-x-2 gap-y-1"
	onsubmit={(event) => {
		event.preventDefault()
		if (onAdd(draft)) draft = ''
	}}
>
	<TextField
		class="min-w-40 flex-1"
		{label}
		{placeholder}
		bind:value={draft}
	/>
	<button
		type="submit"
		class="button button-xs"
		aria-label={addLabel}
	>
		Add
	</button>
</form>
