<script lang="ts">
	import '@viamrobotics/tailwind-config/fonts'

	import '../app.css'

	import type { Snippet } from 'svelte'

	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
	import { ViamProvider } from '@viamrobotics/svelte-sdk'

	import { page } from '$app/state'

	import { createMachineConfigs } from './machines/machine-configs.svelte'
	import MachineList from './machines/machine-list.svelte'
	import { getDialConf, loadRobots } from './robots'
	import Widgets from './widgets/widgets.svelte'

	interface Props {
		children?: Snippet
	}

	const { children }: Props = $props()

	const machines = createMachineConfigs(loadRobots())

	const requestedName = $derived(page.url.searchParams.get('machine'))
	const selectedMachine = $derived(
		machines.current.find(({ name }) => name === requestedName) ?? machines.current.at(0)
	)
	const selectedName = $derived(selectedMachine?.name)
	const partID = $derived(selectedMachine?.partId ?? '')
	const dialConfigs = $derived(selectedMachine ? { [partID]: getDialConf(selectedMachine) } : {})
</script>

<div class="h-screen w-screen">
	<ViamProvider {dialConfigs}>
		{#if selectedMachine}
			<Widgets
				{partID}
				urlHash={page.url.hash}
			>
				<MachineList
					{machines}
					{selectedName}
				/>
			</Widgets>
		{:else}
			<div class="mx-auto flex max-w-md flex-col gap-2 py-8">
				<h1 class="text-heading text-lg">No machines yet</h1>
				<p class="text-subtle-1 text-sm">Add a machine below to start testing its resources.</p>
				<MachineList
					{machines}
					{selectedName}
				/>
			</div>
		{/if}

		<SvelteQueryDevtools buttonPosition="bottom-left" />
	</ViamProvider>
</div>

{@render children?.()}
