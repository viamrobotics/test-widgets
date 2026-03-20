<script lang="ts">
	import '@fontsource-variable/roboto-mono';
	import '@fontsource-variable/public-sans';
	//import '@viamrobotics/prime-core/prime.css';
	import '../app.css';

	import type { Snippet } from 'svelte';
	import { writable } from 'svelte/store';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';

	import { Icon } from '@viamrobotics/prime-core';
	import { ViamProvider } from '@viamrobotics/svelte-sdk';

	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import ControlView from './control-view/control-view.svelte';

	import { getDialConf, loadRobots } from './robots';
	interface Props {
		children?: Snippet;
	}

	const { children }: Props = $props();

	const robots = loadRobots();

	const part = writable(page.params.name ?? Object.keys(robots).at(0));
	$effect.pre(() => {
		if (page.params.name) {
			part.set(page.params.name);
		}
	});

	const playgroundRobot = $derived(robots[$part]);
	const partID = $derived(playgroundRobot?.partId ?? '');
	const dialConfigs = $derived(playgroundRobot ? { [partID]: getDialConf(playgroundRobot) } : {});
</script>

<div class="h-screen w-screen">
	<ViamProvider {dialConfigs}>
		<ControlView
			{partID}
			urlHash={page.url.hash}
		>
			<div class="py-3">
				<nav>
					<ul>
						{#each Object.keys(robots) as name, i (i)}
							{@const isCurrent = page.params.name ? name === page.params.name : i === 0}
							<li>
								<a
									href={resolve(`/${name}`)}
									class="hover:bg-ghost-light focus:bg-ghost-light active:bg-ghost-medium flex items-center gap-1.5 px-3 py-1 text-sm sm:px-5"
								>
									<Icon
										name="check"
										cx={['text-gray-6', { 'opacity-0': !isCurrent }]}
									/>
									<Icon
										name="robot-outline"
										cx="text-gray-6"
									/>
									<span class="truncate overflow-auto">
										{name}
									</span>
								</a>
							</li>
						{/each}
					</ul>
				</nav>
			</div>
		</ControlView>

		<SvelteQueryDevtools buttonPosition="bottom-left" />
	</ViamProvider>
</div>

{@render children?.()}
