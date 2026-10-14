<script lang="ts">
	import { Button } from '@viamrobotics/prime-core'
	import { ViamProvider } from '@viamrobotics/svelte-sdk'

	import { page } from '$app/state'
	import CustomControl from '$lib/components/widgets/custom-control/custom-control.svelte'

	import { createMachineConfigs } from '../machines/machine-configs.svelte'
	import { getDialConf, loadRobots } from '../robots'
	import { createDefaultArtifact } from './default-artifact'

	const machines = createMachineConfigs(loadRobots())

	const partID = $derived(
		page.url.searchParams.get('partID') ?? machines.current.at(0)?.partId ?? ''
	)
	const resourceName = $derived(page.url.searchParams.get('resourceName') ?? '')
	const machine = $derived(machines.current.find(({ partId }) => partId === partID))
	const dialConfigs = $derived(machine ? { [partID]: getDialConf(machine) } : {})

	// The textarea overwrites this derived value, and a new resourceName resets it.
	let draft = $derived(createDefaultArtifact(resourceName))
	let applied = $state<string>()
	const html = $derived(applied ?? createDefaultArtifact(resourceName))

	const textareaID = 'custom-control-html'
</script>

<!--
	The root layout renders this page outside its ViamProvider, so the page brings its own and
	covers the layout's machine view.
-->
<main class="bg-extralight fixed inset-0 z-50 overflow-auto p-6">
	<div class="mx-auto flex max-w-3xl flex-col gap-4">
		<h1 class="text-heading text-lg">Custom control</h1>

		<dl class="text-subtle-1 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
			<dt>Part ID</dt>
			<dd class="font-roboto-mono">{partID || 'not set'}</dd>
			<dt>Resource name</dt>
			<dd class="font-roboto-mono">{resourceName || 'not set'}</dd>
		</dl>

		<div class="flex flex-col gap-2">
			<label
				for={textareaID}
				class="text-subtle-1 text-xs"
			>
				Control HTML
			</label>
			<textarea
				id={textareaID}
				bind:value={draft}
				spellcheck="false"
				class="border-medium text-default font-roboto-mono h-48 w-full rounded border bg-white p-2 text-xs"
			></textarea>
			<div>
				<Button onclick={() => (applied = draft)}>Apply</Button>
			</div>
		</div>

		{#if machine && resourceName}
			<div class="border-medium overflow-hidden rounded border">
				<ViamProvider {dialConfigs}>
					<CustomControl
						{partID}
						{resourceName}
						{html}
					/>
				</ViamProvider>
			</div>
		{:else}
			<p class="text-subtle-1 text-sm">
				Open this page with <code class="font-roboto-mono">?partID=…&amp;resourceName=…</code>,
				where the part ID belongs to a machine added in the machine list.
			</p>
		{/if}
	</div>
</main>
