<!-- 
  @component
  A floating Map view panel for the top right of a map. Render it inside `MapLibre`'s children.
-->
<script lang="ts">
	import { Folder, Panel, ToggleButtons } from '@viamrobotics/prime-controls'
	import { CenterControls, FollowControls, SatelliteControls } from '@viamrobotics/prime-map'

	interface Props {
		/** The map's view, flat or pitched. */
		view?: '2D' | '3D'
		/** The point Follow tracks. Follow is held back without one. */
		location?: { latitude: number; longitude: number }
	}

	let { view = $bindable('2D'), location }: Props = $props()

	const VIEW_ITEMS = [
		{ value: '2D', label: '2D' },
		{ value: '3D', label: '3D' },
	]

	const selectView = (value: string) => {
		if (value === '2D' || value === '3D') {
			view = value
		}
	}
</script>

<div class="absolute top-2 right-2 z-10 flex max-h-full max-w-[calc(100%-1rem)] flex-col">
	<Panel
		aria-label="Map view panel"
		class="min-h-0 w-full min-w-44 overflow-auto"
	>
		<Folder title="Map view">
			<div class="flex flex-col gap-2 px-2 pb-2">
				<ToggleButtons
					label="View"
					items={VIEW_ITEMS}
					bind:value={() => view, selectView}
				/>
				<SatelliteControls />
				<FollowControls
					lng={location?.longitude}
					lat={location?.latitude}
				/>
				<CenterControls />
			</div>
		</Folder>
	</Panel>
</div>
