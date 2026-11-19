<script lang="ts">
	import { ViamProvider } from '@viamrobotics/svelte-sdk'

	import { resolve } from '$app/paths'
	import { page } from '$app/state'

	import { createMachineConfigs } from '../machines/machine-configs.svelte'
	import { getDialConf, loadRobots } from '../robots'
	import PanePlayground from './pane-playground.svelte'

	const machines = createMachineConfigs(loadRobots())

	const requestedName = $derived(page.url.searchParams.get('machine'))
	const selectedMachine = $derived(
		machines.current.find(({ name }) => name === requestedName) ?? machines.current.at(0)
	)
	const partID = $derived(selectedMachine?.partId ?? '')
	const dialConfigs = $derived(selectedMachine ? { [partID]: getDialConf(selectedMachine) } : {})

	const widgetsHref = $derived(
		selectedMachine
			? resolve(`/?${new URLSearchParams({ machine: selectedMachine.name }).toString()}`)
			: resolve('/')
	)
</script>

<!-- The root layout renders this page on its own, so the page brings its own ViamProvider. -->
<div class="bg-extralight flex h-screen w-screen flex-col">
	<header class="border-light flex items-center gap-3 border-b bg-white px-4 py-2">
		<h1 class="text-heading text-sm font-semibold">Pane playground</h1>
		{#if selectedMachine}
			<span class="text-subtle-1 font-roboto-mono truncate text-xs">{selectedMachine.name}</span>
		{/if}
		<a
			href={widgetsHref}
			class="text-link focus-ring ml-auto rounded-sm text-xs underline-offset-2 hover:underline"
		>
			Back to widgets
		</a>
	</header>

	{#if selectedMachine}
		<ViamProvider {dialConfigs}>
			{#key partID}
				<PanePlayground {partID} />
			{/key}
		</ViamProvider>
	{:else}
		<p class="text-subtle-1 mx-auto max-w-md py-8 text-sm">
			No machines yet. Add one from the widgets view to lay its motors out here.
		</p>
	{/if}
</div>
