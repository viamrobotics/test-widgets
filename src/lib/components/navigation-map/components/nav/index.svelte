<script lang="ts">
	import type { LngLat } from 'maplibre-gl'
	import type { Snippet } from 'svelte'

	import { NavigationTab, type Obstacle } from '../../types'
	import { useNavigationMap } from '../../use-navigation-map.svelte'
	import ObstaclesTab from './obstacles.svelte'
	import WaypointsTab from './waypoints.svelte'

	interface Props {
		onupdate: (obstacles: Obstacle[]) => void
		onaddwaypoint: (waypoint: LngLat) => void
		ondeletewaypoint: (id: string) => void
		children?: Snippet
	}

	const { onupdate, onaddwaypoint, ondeletewaypoint, children }: Props = $props()

	const nav = useNavigationMap()
</script>

<nav class="py-4 pl-4 sm:h-full sm:w-87.5">
	<ol class="mb-2 flex flex-wrap items-center">
		{#each nav.tabs as tabTitle (tabTitle)}
			{@const selected = nav.tab === tabTitle}
			<li>
				<button
					class={[
						'border-b px-4 py-1 text-sm tracking-normal capitalize',
						selected ? 'border-black font-bold text-gray-600' : 'text-gray-600',
					]}
					onclick={() => {
						nav.tab = tabTitle
					}}
				>
					{tabTitle}
				</button>
			</li>
		{/each}
	</ol>

	{#if nav.tab === NavigationTab.Waypoints}
		<ul
			onmouseleave={() => (nav.hovered = undefined)}
			class="overflow-y-auto py-2 pr-4 sm:h-[calc(100%-38px)]"
		>
			<WaypointsTab
				{onaddwaypoint}
				{ondeletewaypoint}
			/>
		</ul>
	{:else if nav.tab === NavigationTab.Obstacles}
		<ul
			class="overflow-y-auto py-2 pr-4 sm:h-[calc(100%-38px)]"
			onmouseleave={() => (nav.hovered = undefined)}
		>
			<ObstaclesTab {onupdate} />
		</ul>
	{:else}
		<div class="overflow-y-auto py-2 pr-4 sm:h-[calc(100%-38px)]">
			{@render children?.()}
		</div>
	{/if}
</nav>
