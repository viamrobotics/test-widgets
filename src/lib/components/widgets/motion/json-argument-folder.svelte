<script lang="ts">
	import { Folder } from '@viamrobotics/prime-controls'
	import { CodeEditor } from '@viamrobotics/prime-editor'

	interface Props {
		/** The folder's title, and the editor's accessible name. */
		title: string
		value: string
		onValueChange: (value: string) => void
		/** Why the value fails to parse. `undefined` while it parses or is empty. */
		parseError?: string
	}

	const { title, value, onValueChange, parseError }: Props = $props()

	const errorId = $props.id()

	let isOpen = $state(false)

	const hasValue = $derived(value.trim() !== '')
	const isInvalid = $derived(parseError !== undefined)
</script>

<div class="relative min-w-0">
	<Folder
		{title}
		bind:open={isOpen}
	>
		<p class="text-subtle-2 text-xs">Optional JSON</p>
		<CodeEditor
			language="json"
			aria-label={title}
			aria-invalid={isInvalid}
			aria-errormessage={isInvalid ? errorId : undefined}
			class="h-32 overflow-y-auto"
			bind:value={() => value, onValueChange}
		/>
		<!-- Parse errors show in the section's indicator. This copy only names the error for the editor. -->
		{#if isInvalid}
			<span
				id={errorId}
				class="sr-only"
			>
				{parseError}
			</span>
		{/if}
	</Folder>
	<!-- prime-controls Folder takes a string title only, so the collapsed row's caption sits over it. -->
	{#if hasValue && !isOpen}
		<span
			class="text-subtle-2 pointer-events-none absolute top-0 right-6 flex h-6 items-center text-xs"
		>
			Set
		</span>
	{/if}
</div>
