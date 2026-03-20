<script lang="ts">
	import { Button, Icon, Label, NumericInput, Tooltip } from '@viamrobotics/prime-core';

	import { numberValueFromEvent } from '$lib/event-handlers';

	interface Props {
		setRPM: (_: number) => void;
	}

	const { setRPM }: Props = $props();

	let rpm = $state(20);
</script>

<div>
	<Label cx="w-full max-w-[96px] gap-1 text-xs">
		<div class="flex flex-row gap-1">
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
					Speed in revolutions per minute.
				</p>
			</Tooltip>
		</div>

		<NumericInput
			slot="input"
			value={rpm}
			on:change={(event) => {
				rpm = numberValueFromEvent(event) ?? 0;
			}}
		/>
	</Label>
</div>
<div class="mt-auto">
	<Button
		icon="play-circle-outline"
		onclick={() => {
			setRPM(rpm);
		}}
	>
		Execute
	</Button>
</div>
