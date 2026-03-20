<script lang="ts">
	import { Button, Icon, Label, NumericInput, Tooltip } from '@viamrobotics/prime-core';

	import { numberValueFromEvent } from '$lib/event-handlers';

	interface Props {
		goTo: (rpm: number, pos: number) => void;
	}

	const { goTo }: Props = $props();

	let targetPosition = $state(0.5);
	let rpm = $state(10);
</script>

<div class="flex flex-row gap-4">
	<Label cx="max-w-[96px] grow gap-1 text-xs">
		<p class="flex flex-row gap-1">
			RPM
			<Tooltip>
				<Icon
					name="information-outline"
					cx="text-gray-6"
				/>

				<p
					slot="description"
					class="text-xs"
				>
					Speed at which the motor will move in revolutions per minute. Absolute value.
				</p>
			</Tooltip>
		</p>

		<NumericInput
			slot="input"
			value={rpm}
			on:change={(event) => {
				rpm = numberValueFromEvent(event) ?? 0;
			}}
		/>
	</Label>
	<Label cx="max-w-[96px] grow gap-1 text-xs">
		<p class="flex flex-row gap-1 whitespace-nowrap">
			Target position
			<Tooltip>
				<Icon
					name="information-outline"
					cx="text-gray-6"
				/>

				<p
					slot="description"
					class="text-xs whitespace-normal"
				>
					Target position the motor will turn to in revolutions from home/zero.
				</p>
			</Tooltip>
		</p>

		<NumericInput
			slot="input"
			value={targetPosition}
			on:change={(event) => {
				targetPosition = numberValueFromEvent(event) ?? 0;
			}}
		/>
	</Label>
</div>

<div class="mt-auto">
	<Button
		icon="play-circle-outline"
		onclick={() => goTo(rpm, targetPosition)}
	>
		Execute
	</Button>
</div>
