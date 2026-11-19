<script lang="ts">
	import type { Snippet } from 'svelte'

	import { NumberField } from '@viamrobotics/prime-controls'
	import { LngLat } from 'maplibre-gl'

	interface Props {
		/** The label for the Lat,Lng, pair. Defaults to Latitude, Longitude. */
		label?: string
		/** Whether the inputs are readonly. */
		readonly?: boolean
		/** The longitude value. */
		lng?: number
		/** The latitude value. */
		lat?: number
		children?: Snippet
		oninput: (lngLat: LngLat) => void
	}

	const { label, readonly = false, lng, lat, oninput, children }: Props = $props()

	const setLat = (value: number | undefined) => {
		if (value !== undefined && Number.isFinite(value)) {
			oninput(new LngLat(lng ?? 0, value))
		}
	}

	const setLng = (value: number | undefined) => {
		if (value !== undefined && Number.isFinite(value)) {
			oninput(new LngLat(value, lat ?? 0))
		}
	}
</script>

<div
	role="group"
	aria-label={label ?? 'Latitude, longitude'}
	class="flex items-end gap-1.5"
>
	<NumberField
		label="Lat"
		suffix="°"
		step={1}
		class="grow"
		{readonly}
		bind:value={() => lat, setLat}
	/>
	<NumberField
		label="Lng"
		suffix="°"
		step={1}
		class="grow"
		{readonly}
		bind:value={() => lng, setLng}
	/>
	{@render children?.()}
</div>
