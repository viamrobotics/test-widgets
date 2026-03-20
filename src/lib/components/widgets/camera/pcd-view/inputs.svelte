<script lang="ts">
	import type { Vector3Tuple } from 'three';

	import { Label, NumericInput, Select } from '@viamrobotics/prime-core';

	import Download from './download.svelte';

	interface Props {
		pointSize: number;
		up: Vector3Tuple;
		data: Uint8Array;
		onPointSizeChange: (value: number) => void;
		onUpChange: (value: Vector3Tuple) => void;
	}

	const { pointSize, up, data, onPointSizeChange, onUpChange }: Props = $props();

	const coordSystems = [
		['+y', '0,1,0'],
		['-y', '0,-1,0'],
		['+z', '0,0,1'],
		['-z', '0,0,-1'],
		['+x', '1,0,0'],
		['-x', '-1,0,0']
	] as const;

	const handlePointSizeChange = (event: Event) => {
		if (event.target instanceof HTMLInputElement) {
			onPointSizeChange(event.target.valueAsNumber);
		}
	};

	const handleUpChange = (event: Event) => {
		if (event.target instanceof HTMLSelectElement) {
			onUpChange(event.target.value.split(',').map(Number) as Vector3Tuple);
		}
	};
</script>

<div class="flex w-1/3 flex-col gap-2">
	<Label>
		Point size

		<NumericInput
			slot="input"
			step={0.01}
			min={0}
			value={pointSize}
			on:change={handlePointSizeChange}
		/>
	</Label>

	<Label>
		Camera up vector

		<Select
			slot="input"
			on:change={handleUpChange}
		>
			{#each coordSystems as [text, coord] (coord)}
				<option
					selected={coord === up.toString()}
					value={coord}>{text}</option
				>
			{/each}
		</Select>
	</Label>

	<Download {data} />
</div>
