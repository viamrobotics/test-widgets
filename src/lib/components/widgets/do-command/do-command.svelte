<script lang="ts">
	import type { Snippet } from 'svelte'

	import { Button, Kbd, KbdGroup, Progress } from '@viamrobotics/prime-core'
	import { CodeEditor } from '@viamrobotics/prime-core/code-editor'
	import { type ResourceName, Struct } from '@viamrobotics/sdk'
	import { createResourceMutation } from '@viamrobotics/svelte-sdk'
	import { PersistedState } from 'runed'

	import { supportsDoCommand } from '$lib/client-map'
	import { getResourceAPI } from '$lib/get-resource-api'
	import { getResourceKey } from '$lib/get-resource-key'

	import ErrorDisplay from '../../error.svelte'
	import { createDoCommandClient } from './create-do-command-client.svelte'

	interface Props {
		partID: string
		resource: ResourceName
		/** Rendered above the input/output editor row. */
		header?: Snippet<[{ input: string; setInput: (value: string) => void }]>
		/**
		 * Optional bindable editor value. Use `bind:input` (including function
		 * bindings) to control it from a parent. When unbound, falls back to the
		 * widget's persisted local state — assignments still update locally so the
		 * editor cannot freeze.
		 */
		input?: string
	}

	let { partID, resource, header, input = $bindable() }: Props = $props()

	const client = createDoCommandClient(
		() => resource,
		() => partID,
		() => resource.name
	)

	const doCommandMutation = createResourceMutation(client, 'doCommand')

	const isSupported = $derived(supportsDoCommand(resource))

	let lastErr = $state<Error | null>()

	const uid = $props.id()

	const persisted = $derived(new PersistedState(`${partID}/${getResourceKey(resource)}`, '{\n}'))

	const displayInput = $derived(input ?? persisted.current ?? '{\n}')

	let output = $state('')

	const updateInput = (value: string) => {
		input = value
		persisted.current = value
	}

	const setInput = (value: string) => {
		updateInput(value)
	}

	const execute = async () => {
		try {
			lastErr = null
			output = ''
			const parsedInput = Struct.fromJsonString(displayInput)
			const data = await doCommandMutation.mutateAsync([parsedInput])
			output = JSON.stringify(data, null, 2)
			lastErr = null
		} catch (error) {
			lastErr = error as Error
		}
	}

	let inputPanel = $state<HTMLElement | undefined>()

	const isMac = globalThis.navigator?.userAgent.includes('Mac') ?? false
	const modifierGlyph = isMac ? '⌘' : '⌃'

	const onWindowKeydown = (event: KeyboardEvent) => {
		if (
			event.key === 'Enter' &&
			(event.metaKey || event.ctrlKey) &&
			inputPanel?.contains(event.target as Node)
		) {
			event.preventDefault()
			if (!doCommandMutation.isPending) {
				void execute()
			}
		}
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

{#if isSupported}
	{#if header}
		<div class="border-b">
			{@render header({ input: displayInput, setInput })}
		</div>
	{/if}
	<div class="flex flex-row">
		<div
			class="flex w-1/2 flex-col gap-2 border-r py-2"
			bind:this={inputPanel}
		>
			<span class="text-subtle-1 px-4 font-mono text-xs tracking-wider uppercase">Input</span>
			<CodeEditor
				label="input"
				language="json"
				value={displayInput}
				onChange={(nextInput: string) => {
					updateInput(nextInput)
				}}
				class="h-56 overflow-y-auto"
				errorMessageID={lastErr ? uid : undefined}
			/>
			<div class="flex flex-row items-center justify-end gap-2 px-4">
				<KbdGroup>
					<Kbd>{modifierGlyph}</Kbd>
					<Kbd>⏎</Kbd>
				</KbdGroup>
				<Button
					disabled={doCommandMutation.isPending}
					onclick={execute}>Execute</Button
				>
			</div>
		</div>

		<div class="flex w-1/2 flex-col gap-2 py-2">
			<div class="flex flex-row items-center">
				<span class="text-subtle-1 px-4 font-mono text-xs tracking-wider uppercase">Output</span>
				{#if doCommandMutation.isPending}
					<Progress
						size="medium"
						variant="dark"
					/>
				{/if}
			</div>
			{#if !lastErr}
				<CodeEditor
					label="output"
					language="json"
					value={output}
					readonly
					class="h-56 overflow-y-auto"
				/>
			{:else}
				<ErrorDisplay
					id={uid}
					class="h-56 px-4"
					lastError={lastErr}
				/>
			{/if}
		</div>
	</div>
{:else}
	<ErrorDisplay
		class="p-4"
		lastError={new Error(
			`DoCommand for ${getResourceAPI(
				resource
			)} is not supported in the UI. Consider using one of our SDKs.`
		)}
	/>
{/if}
