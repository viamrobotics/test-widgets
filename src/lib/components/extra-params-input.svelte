<!--
@component

A collapsible JSON editor for the optional `extra` argument accepted by
resource API methods, backed by a persisted ExtraParamsStore.
-->
<script lang="ts">
	import { Expandable, Icon } from '@viamrobotics/prime-core'
	import { CodeEditor } from '@viamrobotics/prime-core/code-editor'

	import type { ExtraParamsStore } from './extra-params-store.svelte'

	import ErrorDisplay from './error.svelte'

	interface Props {
		store: ExtraParamsStore
		class?: string
	}

	const { store, class: className = '' }: Props = $props()

	const uid = $props.id()

	// Auto-expand when a previous session left params behind; only the
	// initial text matters here.
	// svelte-ignore state_referenced_locally
	let open = $state(store.text.trim() !== '')
</script>

<Expandable
	bind:open
	class={className}
	triggerClass="text-subtle-2 hover:text-default flex flex-row items-center gap-1 text-xs"
	contentClass="pt-2"
>
	{#snippet trigger({ isOpen })}
		<Icon name={isOpen ? 'chevron-down' : 'chevron-right'} />
		Additional parameters (extra)
	{/snippet}
	{#snippet content()}
		<div class="flex max-w-md flex-col gap-2">
			<CodeEditor
				label="extra"
				language="json"
				value={store.text}
				onChange={(contents: string) => {
					store.text = contents
				}}
				class="h-24 overflow-y-auto"
				isInvalid={store.error !== undefined}
				errorMessageID={store.error ? uid : undefined}
			/>
			{#if store.error}
				<ErrorDisplay
					id={uid}
					lastError={store.error}
				/>
			{/if}
		</div>
	{/snippet}
</Expandable>
