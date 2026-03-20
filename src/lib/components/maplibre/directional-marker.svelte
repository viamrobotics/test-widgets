<script lang="ts">
	import Marker from './marker.svelte';

	interface Props {
		/** The longitude of the marker. */
		lng?: number;
		/** The latitude of the marker. */
		lat?: number;
		/** The rotation angle of the marker (clockwise, in degrees) */
		rotation?: number;
		/** The relative size of the marker. */
		scale?: number;
	}

	const { lng = 0, lat = 0, rotation = 0, scale = 1 }: Props = $props();

	let element = $state.raw<HTMLElement>();

	const url = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='green' stroke='white' stroke-width='2' %3E%3Cpath d='M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z' /%3E%3C/svg%3E")`;
</script>

<div
	bind:this={element}
	class="h-7.5 w-7.5"
	style:background-image={url}
></div>

<Marker
	{element}
	{lng}
	{lat}
	{rotation}
	{scale}
/>
