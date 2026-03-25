<script lang="ts">
	import { Button, Icon, Label, NumericInput, Tooltip } from '@viamrobotics/prime-core'

	import { numberValueFromEvent } from '$lib/event-handlers'

	interface Props {
		setPower: (_: number) => void
	}

	const { setPower }: Props = $props()

	let power = $state(0.5)
</script>

<div>
	<Label cx="w-full max-w-[96px] gap-1 text-xs">
		<div class="flex flex-row gap-1">
			Power
			<Tooltip>
				<Icon
					name="information-outline"
					cx="text-gray-6"
				/>

				<p
					slot="description"
					class="text-xs"
				>
					The percentage of max power to send to the motor, in the range of –1.0 to 1.0.
					<br /><br />
					1 is 100% power forward; –1 is 100% power backward.
				</p>
			</Tooltip>
		</div>

		<NumericInput
			slot="input"
			value={power}
			on:change={(event) => {
				power = numberValueFromEvent(event) ?? 0
			}}
		/>
	</Label>
</div>
<div class="mt-auto">
	<Button
		icon="play-circle-outline"
		onclick={() => {
			setPower(power)
		}}
	>
		Execute
	</Button>
</div>
