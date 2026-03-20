<script lang="ts">
	import type { Snippet } from 'svelte';
	import { LngLat } from 'maplibre-gl';

	import { SliderInput } from '@viamrobotics/prime-core';

	interface Props {
		/** The label for the Lat,Lng, pair. Defaults to Latitude, Longitude. */
		label?: string;
		/** Whether the inputs are readonly. */
		readonly?: boolean;
		/** The longitude value. */
		lng?: number;
		/** The latitude value. */
		lat?: number;
		children?: Snippet;
		oninput: (lngLat: LngLat) => void;
	}

	const { label, readonly = false, lng, lat, oninput, children }: Props = $props();

	let latInput = $state.raw<HTMLInputElement>();
	let lngInput = $state.raw<HTMLInputElement>();
</script>

<div class="flex items-end gap-1.5">
	<SliderInput
		bind:input={latInput}
		type="number"
		label={label ?? 'Latitude'}
		placeholder="0"
		incrementor={readonly ? undefined : 'slider'}
		value={lat}
		step={1}
		class="grow"
		on:change={() => oninput(new LngLat(lng ?? 0, latInput?.valueAsNumber ?? 0))}
		on:input={() => oninput(new LngLat(lng ?? 0, latInput?.valueAsNumber ?? 0))}
		{readonly}
	/>
	<SliderInput
		bind:input={lngInput}
		type="number"
		label={label ? '' : 'Longitude'}
		placeholder="0"
		incrementor={readonly ? undefined : 'slider'}
		value={lng}
		step={1}
		class="grow"
		on:change={() => oninput(new LngLat(lngInput?.valueAsNumber ?? 0, lat ?? 0))}
		on:input={() => oninput(new LngLat(lngInput?.valueAsNumber ?? 0, lat ?? 0))}
		{readonly}
	/>
	{@render children?.()}
</div>
