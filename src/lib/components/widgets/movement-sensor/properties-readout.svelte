<script lang="ts">
	import type { MovementSensorProperties } from '@viamrobotics/sdk'

	import SupportRow from './support-row.svelte'

	interface Props {
		properties: MovementSensorProperties | undefined
	}

	const { properties }: Props = $props()

	const rows = $derived([
		{ label: 'Position', isSupported: properties?.positionSupported },
		{ label: 'Orientation', isSupported: properties?.orientationSupported },
		{ label: 'Compass heading', isSupported: properties?.compassHeadingSupported },
		{ label: 'Linear velocity', isSupported: properties?.linearVelocitySupported },
		{ label: 'Angular velocity', isSupported: properties?.angularVelocitySupported },
		{ label: 'Linear acceleration', isSupported: properties?.linearAccelerationSupported },
	])
</script>

<div
	role="group"
	aria-label="Supported methods"
	class="flex min-w-0 flex-col gap-1"
>
	{#each rows as row (row.label)}
		<SupportRow
			label={row.label}
			isSupported={row.isSupported}
		/>
	{/each}
</div>
