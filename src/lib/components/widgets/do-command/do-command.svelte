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
	}

	const { partID, resource, header }: Props = $props()

	const client = createDoCommandClient(
		() => resource,
		() => partID,
		() => resource.name
	)

	const doCommandMutation = createResourceMutation(client, 'doCommand')

	const isSupported = $derived(supportsDoCommand(resource))

	let lastErr = $state<Error | null>()

	const uid = $props.id()

	const input = $derived(new PersistedState(`${partID}/${getResourceKey(resource)}`, '{\n}'))

	let output = $state('')

	const setInput = (value: string) => {
		input.current = value
	}

	const execute = async () => {
		try {
			lastErr = null
			output = ''
			const parsedInput = Struct.fromJsonString(input.current ?? '{}')
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
			{@render header({ input: input.current ?? '{}', setInput })}
		</div>
	{/if}
	<div class="flex flex-row items-center justify-between">
		<div class="flex w-[45%] flex-col gap-2 border-r py-2">
			<span class="text-gray-9 px-4 text-sm font-medium">Input</span>
			<CodeEditor
				label="input"
				language="json"
				value={input.current ?? '{}'}
				onChange={(nextInput: string) => {
					input.current = nextInput
				}}
				class="h-56 overflow-y-auto"
				errorMessageID={lastErr ? uid : undefined}
			/>
		</div>

		<Button
			class="m-auto"
			onclick={execute}>Execute</Button
		>

		<div class="flex w-[45%] flex-col gap-2 border-l py-2">
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
