<script lang="ts">
	import AddWaypointWidget from './add-waypoint-widget.svelte'
	import GetLocationWidget from './get-location-widget.svelte'
	import GetModeWidget from './get-mode-widget.svelte'
	import GetObstaclesWidget from './get-obstacles-widget.svelte'
	import GetWaypointsWidget from './get-waypoints-widget.svelte'
	import RemoveWaypointWidget from './remove-waypoint-widget.svelte'
	import SetModeWidget from './set-mode-widget.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()
</script>

<div class="@container">
	<div class="flex flex-col divide-y">
		<GetModeWidget
			{partID}
			{resourceName}
		/>
		<div
			role="group"
			aria-label="Mutators"
			class="grid grid-cols-1 divide-y @2xl:grid-cols-2 @2xl:divide-y-0 @4xl:grid-cols-3"
		>
			<SetModeWidget
				{partID}
				{resourceName}
			/>
			<AddWaypointWidget
				{partID}
				{resourceName}
			/>
			<RemoveWaypointWidget
				{partID}
				{resourceName}
			/>
		</div>
		<div
			role="group"
			aria-label="Queries"
			class="grid grid-cols-1 divide-y @2xl:grid-cols-2 @2xl:divide-y-0 @4xl:grid-cols-3"
		>
			<GetLocationWidget
				{partID}
				{resourceName}
			/>
			<GetWaypointsWidget
				{partID}
				{resourceName}
			/>
			<GetObstaclesWidget
				{partID}
				{resourceName}
			/>
		</div>
	</div>
</div>
