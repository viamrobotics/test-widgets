<script lang="ts">
	import { PersistedState } from 'runed';

	import { Button } from '@viamrobotics/prime-core';
	import { JsonEditor } from '@viamrobotics/prime-editor';
	import { MLModelClient, ResourceName, Struct } from '@viamrobotics/sdk';
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk';

	import { clientForBuiltinResource } from '$lib/builtin';
	import { getResourceAPI, getResourceKey } from '$lib/resource';
	import ErrorDisplay from '../../error-display.svelte';

	interface Props {
		partID: string;
		resource: ResourceName;
	}

	const { partID, resource }: Props = $props();

	type DoCommandable = Extract<ReturnType<typeof clientForBuiltinResource>, MLModelClient>;

	const resourceClientType = clientForBuiltinResource(resource) as DoCommandable;

	const client = createResourceClient(
		resourceClientType,
		() => partID,
		() => resource.name
	);

	const doCommandMutation = createResourceMutation(client, 'doCommand');

	let lastErr = $state<Error | null>();

	const uid = $props.id();

	const input = new PersistedState(`${partID}/${getResourceKey(resource)}`, '{\n}');

	let output = $state('');

	const execute = async () => {
		try {
			const parsedInput = Struct.fromJsonString(input.current ?? '{}');
			const data = await doCommandMutation.mutateAsync([parsedInput]);
			output = JSON.stringify(data, null, 2);
			lastErr = null;
		} catch (error) {
			lastErr = error as Error;
		}
	};
</script>

{#if doCommandMutation}
	<div class="flex flex-row items-center justify-between">
		<div class="flex w-[45%] flex-col gap-2 border-r py-2">
			<span class="text-gray-9 px-4 text-sm font-medium">Input</span>
			<JsonEditor
				label="input"
				initialValue={input.current ?? '{}'}
				onChange={(nextInput: string) => {
					input.current = nextInput;
				}}
				cx="h-56 overflow-y-auto"
				errorMessageID={lastErr ? uid : undefined}
			/>
		</div>

		<Button
			class="m-auto"
			onclick={execute}>Execute</Button
		>

		<div class="flex w-[45%] flex-col gap-2 border-l py-2">
			<span class="text-gray-9 px-4 text-sm font-medium">Output</span>
			{#if !lastErr}
				<JsonEditor
					label="output"
					initialValue={output}
					readonly
					cx="h-56 overflow-y-auto"
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
