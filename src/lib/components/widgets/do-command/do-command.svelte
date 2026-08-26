<script lang="ts">
	import type { Snippet } from 'svelte'

	import { Button, Progress } from '@viamrobotics/prime-core'
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
</script>

{#if isSupported}
	{#if header}
		<div class="border-b">
			{@render header({ input: displayInput, setInput })}
		</div>
	{/if}
	<div class="@container">
		<div class="flex flex-col @2xl:flex-row">
			<div class="flex min-w-0 flex-col gap-2 py-2 @2xl:flex-1">
				<span class="text-gray-9 px-4 text-sm font-medium">Input</span>
				<CodeEditor
					label="input"
					language="json"
					value={displayInput}
					onChange={(nextInput: string) => {
						updateInput(nextInput)
					}}
					class="h-40 overflow-y-auto @2xl:h-56"
					errorMessageID={lastErr ? uid : undefined}
				/>
			</div>

			<div
				class="flex shrink-0 items-center justify-center border-y px-4 py-2 @2xl:border-x @2xl:border-y-0 @2xl:py-0"
			>
				<Button onclick={execute}>Execute</Button>
			</div>

			<div class="flex min-w-0 flex-col gap-2 py-2 @2xl:flex-1">
				<div class="flex flex-row items-center">
					<span class="text-gray-9 px-4 text-sm font-medium">Output</span>
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
						class="h-40 overflow-y-auto @2xl:h-56"
					/>
				{:else}
					<ErrorDisplay
						id={uid}
						class="h-40 px-4 @2xl:h-56"
						lastError={lastErr}
					/>
				{/if}
			</div>
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
