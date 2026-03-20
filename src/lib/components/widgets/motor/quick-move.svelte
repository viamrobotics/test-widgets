<script lang="ts">
	import { Icon, Label, RangeInput } from '@viamrobotics/prime-core';

	import { numberValueFromEvent } from '$lib/event-handlers';

	interface Props {
		setPower: (_: number) => void;
	}

	const { setPower }: Props = $props();

	let powerPct = $state(0.5);

	let isPressed = false;
	const move = (forward: boolean) => {
		isPressed = true;
		setPower((forward ? 1 : -1) * powerPct);
	};
	const stop = () => {
		if (isPressed) {
			setPower(0);
		}
		isPressed = false;
	};
</script>

<Label cx="max-w-[282px]">
	<span class="text-subtle-1 text-xs">Power</span>

	<RangeInput
		slot="input"
		value={powerPct}
		max={1}
		step={0.05}
		on:input={(event) => {
			// on:input is used instead of on:change because of the on:mousedown handlers and blur order
			// on:change does not run in time.
			powerPct = numberValueFromEvent(event) ?? 0;
		}}
	/>
</Label>

<div class="flex flex-col gap-4">
	<div class="flex flex-row gap-4">
		<!-- NOTE(zp,2024-06-04) these are not prime buttons because prime does not provide on:mousedown or on:mouseup -->
		<button
			onmousedown={() => {
				move(true);
			}}
			onmouseup={stop}
			onmouseleave={stop}
			class="border-light bg-light hover:border-medium hover:bg-medium active:bg-gray-2 w-20 border p-3 py-3"
		>
			<div class="flex flex-col gap-2">
				<Icon
					name="arrow-up"
					cx="text-gray-6 self-center"
				/>
				<p class="font-roboto-mono text-xs uppercase">forward</p>
			</div>
		</button>
		<button
			onmousedown={() => {
				move(false);
			}}
			onmouseup={stop}
			onmouseleave={stop}
			class="border-light bg-light hover:border-medium hover:bg-medium active:bg-gray-2 w-20 border p-3 py-3"
		>
			<div class="flex flex-col gap-2">
				<Icon
					name="arrow-up"
					cx="text-gray-6 rotate-180 self-center"
				/>
				<p class="font-roboto-mono text-xs uppercase">backward</p>
			</div>
		</button>
	</div>

	<p class="text-subtle-2 mt-auto ml-auto text-xs">Press and hold</p>
</div>
