<script lang="ts">
	import type { Snippet } from 'svelte'

	import { mdiAlertCircle } from '@mdi/js'
	import { CodeEditor } from '@viamrobotics/prime-editor'
	import { Banner, Icon, Progress, Tooltip } from '@viamrobotics/prime-ui'
	import { type ResourceName, Struct } from '@viamrobotics/sdk'
	import { createResourceMutation } from '@viamrobotics/svelte-sdk'
	import { PersistedState } from 'runed'
	import { untrack } from 'svelte'

	import { supportsDoCommand } from '$lib/client-map'
	import { Section } from '$lib/components/section'
	import {
		claimSectionHostScope,
		createSectionScope,
		provideSectionScope,
	} from '$lib/components/section/section-scope-context.svelte'
	import { getResourceAPI } from '$lib/get-resource-api'
	import { getResourceKey } from '$lib/get-resource-key'

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

	let lastError = $state<Error | null>(null)

	const persisted = $derived(new PersistedState(`${partID}/${getResourceKey(resource)}`, '{\n}'))

	const displayInput = $derived(input ?? persisted.current ?? '{\n}')

	const uid = $props.id()

	let output = $state('')

	const updateInput = (value: string) => {
		input = value
		persisted.current = value
	}

	const inputError = $derived.by(() => {
		try {
			Struct.fromJsonString(displayInput)
			return null
		} catch (error) {
			return error instanceof Error ? error : new Error(String(error))
		}
	})

	// Inside a host's scope the host's header carries the indicator. Bare, the widget scopes itself.
	const hostScope = claimSectionHostScope()
	const getOwnSources = () => ({ method: 'DoCommand' })
	if (hostScope === undefined) provideSectionScope(createSectionScope(getOwnSources))

	$effect(() => {
		// Registering writes the scope's contributors, so it must not subscribe this effect to them.
		return untrack(() => hostScope?.register(getOwnSources))
	})

	const execute = async () => {
		if (doCommandMutation.isPending) return
		if (inputError) {
			lastError = inputError
			return
		}
		try {
			lastError = null
			const parsedInput = Struct.fromJsonString(displayInput)
			const data = await doCommandMutation.mutateAsync([parsedInput])
			output = JSON.stringify(data, null, 2)
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error))
		}
	}
</script>

{#if isSupported}
	<Section.Error error={lastError} />
	{#if header}
		<div class="border-b">
			{@render header({ input: displayInput, setInput: updateInput })}
		</div>
	{/if}
	<div class="@container">
		<div class="flex flex-col @2xl:flex-row">
			<div class="flex min-w-0 flex-col gap-2 py-2 @2xl:flex-1">
				<div class="flex flex-row items-center gap-1 px-4">
					<span
						id="{uid}-input"
						class="text-default text-sm font-medium">Input</span
					>
					{#if inputError}
						<Tooltip>
							<Tooltip.Trigger>
								<button
									type="button"
									class="text-danger-dark icon-button size-6"
									aria-label="Input is not valid JSON"
								>
									<Icon
										icon={mdiAlertCircle}
										size="sm"
									/>
								</button>
							</Tooltip.Trigger>
							<Tooltip.Content>{inputError.message}</Tooltip.Content>
						</Tooltip>
					{/if}
				</div>
				<CodeEditor
					aria-labelledby="{uid}-input"
					aria-invalid={inputError ? 'true' : undefined}
					language="json"
					bind:value={() => displayInput, updateInput}
					class={['h-40 overflow-y-auto @2xl:h-56', inputError && 'border-danger-dark border']}
				/>
			</div>

			<div
				class="flex shrink-0 items-center justify-center border-y px-4 py-2 @2xl:border-x @2xl:border-y-0 @2xl:py-0"
			>
				<button
					type="button"
					class="button button-compact"
					aria-busy={doCommandMutation.isPending}
					onclick={execute}
				>
					Execute
				</button>
			</div>

			<div class="flex min-w-0 flex-col gap-2 py-2 @2xl:flex-1">
				<div class="flex flex-row items-center gap-2 pr-4">
					<span
						id="{uid}-output"
						class="text-default pl-4 text-sm font-medium">Output</span
					>
					{#if doCommandMutation.isPending}
						<Progress
							label="Running command"
							class="w-24"
						/>
					{/if}
					{#if hostScope === undefined}
						<span class="ml-auto"><Section.Errors /></span>
					{/if}
				</div>
				<CodeEditor
					aria-labelledby="{uid}-output"
					language="json"
					value={output}
					readonly
					class="h-40 overflow-y-auto @2xl:h-56"
				/>
			</div>
		</div>
	</div>
{:else}
	<div class="p-4">
		<Banner variant="info">
			<Banner.Description>
				DoCommand for {getResourceAPI(resource)} is not supported in the UI. Consider using one of our
				SDKs.
			</Banner.Description>
		</Banner>
	</div>
{/if}
