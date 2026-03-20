<script lang="ts">
	import { Input, Label, ToggleButtons } from '@viamrobotics/prime-core';

	import { PinModes, type PinSelection, PinTypes } from './board.ts';

	interface Props {
		// NOTE(zp,2024-06-25) This was done instead of a bind:value to simplify unit-testing
		value: PinSelection;
		onChange: (newVal: PinSelection) => void;
	}

	const { value, onChange }: Props = $props();

	const changePin = (event: Event) => {
		const { value: newPinValue } = event.target as HTMLInputElement;
		onChange({ ...value, pin: newPinValue });
	};

	const changeType = (event: CustomEvent<string>) => {
		onChange({
			...value,
			type: event.detail === PinTypes.GPIO ? PinTypes.GPIO : PinTypes.ANALOG
		});
	};

	const changeMode = (event: CustomEvent<string>) => {
		onChange({
			...value,
			mode: event.detail === PinModes.READ ? PinModes.READ : PinModes.WRITE
		});
	};
</script>

<div class="flex flex-col gap-4">
	<Label>
		Pin

		<Input
			slot="input"
			cx="max-w-[120px]"
			placeholder="0"
			value={value.pin}
			on:change={changePin}
		/>
	</Label>

	<ToggleButtons
		cx="w-fit!"
		options={[PinTypes.GPIO, PinTypes.ANALOG]}
		selected={value.type}
		on:input={changeType}
	>
		{#snippet legend()}
			Pin type
		{/snippet}
	</ToggleButtons>

	<ToggleButtons
		aria-label="Mode"
		cx="w-fit!"
		options={[PinModes.READ, PinModes.WRITE]}
		selected={value.mode}
		on:input={changeMode}
	>
		{#snippet legend()}
			Mode
		{/snippet}
	</ToggleButtons>
</div>
