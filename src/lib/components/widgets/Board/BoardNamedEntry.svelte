<!--
@component
One named row in a board control's list: the name as its heading, a Remove button, and the row's
body. Remove moves focus to the next row's Remove, else the previous row's, else the add field.
-->
<script lang="ts">
	import type { Snippet } from 'svelte'

	import { mdiClose } from '@mdi/js'
	import { Icon } from '@viamrobotics/prime-ui'
	import { tick } from 'svelte'

	interface Props {
		name: string
		/** The Remove button's accessible name, such as "Remove pin 11". */
		removeLabel: string
		onRemove: () => void
		children: Snippet
	}

	const { name, removeLabel, onRemove, children }: Props = $props()

	const ENTRY_SELECTOR = '[data-board-entry]'
	const REMOVE_SELECTOR = '[data-board-entry-remove]'

	const nameId = $props.id()

	let entry = $state<HTMLDivElement>()

	const removeButtonIn = (sibling: Element | null | undefined) =>
		sibling?.matches(ENTRY_SELECTOR) ? sibling.querySelector<HTMLElement>(REMOVE_SELECTOR) : null

	// The row unmounts under the focused button, and focus would drop to the page.
	const remove = async () => {
		const nextFocusTarget =
			removeButtonIn(entry?.nextElementSibling) ??
			removeButtonIn(entry?.previousElementSibling) ??
			entry?.parentElement?.querySelector<HTMLElement>('form input')
		onRemove()
		await tick()
		nextFocusTarget?.focus()
	}
</script>

<div
	bind:this={entry}
	data-board-entry
	role="group"
	aria-labelledby={nameId}
	class="border-light flex min-w-0 flex-col gap-1 border-t pt-2"
>
	<div class="flex items-center gap-1">
		<h4
			id={nameId}
			class="min-w-0 flex-1 truncate text-xs font-semibold"
		>
			<span class="font-roboto-mono">{name}</span>
		</h4>
		<button
			data-board-entry-remove
			type="button"
			class="icon-button size-6"
			aria-label={removeLabel}
			onclick={remove}
		>
			<Icon
				icon={mdiClose}
				size="sm"
			/>
		</button>
	</div>

	{@render children()}
</div>
