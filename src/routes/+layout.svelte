<script lang="ts">
	import '@viamrobotics/tailwind-config/fonts'

	import '../app.css'

	import type { Snippet } from 'svelte'

	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
	import { ViamProvider } from '@viamrobotics/svelte-sdk'

	import { resolve } from '$app/paths'
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

	// The pane playground is its own screen with its own provider, so the widgets view stays out.
	const isPanesRoute = $derived(page.route.id === '/panes')
	const panesHref = $derived(
		resolve(`/panes?${new URLSearchParams({ machine: selectedName ?? '' }).toString()}`)
	)
</script>

{#if !isPanesRoute}
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
					<div class="px-3 py-2 sm:px-5">
						<a
							href={panesHref}
							class="text-link focus-ring rounded-sm text-xs underline-offset-2 hover:underline"
						>
							Open the pane playground
						</a>
					</div>
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
{/if}

{@render children?.()}
