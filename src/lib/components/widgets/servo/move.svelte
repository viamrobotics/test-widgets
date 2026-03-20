<script lang="ts">
	import { Button, Icon, Label, NumericInput, Tooltip } from '@viamrobotics/prime-core'

	import ErrorDisplay from '$lib/components/error-display.svelte'
	import { numberValueFromEvent } from '$lib/event-handlers'

	interface Props {
		currentPosition: number
		moveTo: (angle: number) => void
		lastError: Error | null
	}

	const { currentPosition, moveTo, lastError }: Props = $props()

	let desiredAngle = $state(0)

	const desiredAngleErrorID = $props.id()
</script>

<div class="flex flex-col gap-5">
	<Label cx="max-w-[100px]">
		<div class="flex flex-col gap-1">
			<p class="relative">
				Desired angle
				<abbr class="text-subtle-2">(º)</abbr>
				<!-- absolute so that the tooltip can extend past the label width -->
				<span class="absolute ml-1">
					<Tooltip>
						<Icon
							name="information-outline"
							cx="text-gray-6"
						/>

						<p
							slot="description"
							class="text-xs"
						>
							Accepts angles between 0-180 degrees
						</p>
					</Tooltip>
				</span>
			</p>
			<NumericInput
				type="integer"
				value={desiredAngle}
				on:change={(event) => {
					desiredAngle = numberValueFromEvent(event) ?? 0
				}}
				step={1}
				aria-errormessage={desiredAngleErrorID}
			/>
		</div>
	</Label>
	{#if desiredAngle < 0}
		<p
			id={desiredAngleErrorID}
			class="text-danger-dark text-xs"
		>
			Desired angle must be non-negative
		</p>
	{/if}
	<div class="mb-2 flex flex-col gap-2">
		<span class="flex flex-row gap-2">
			<h4 class="text-xs font-semibold">Quick set</h4>
			<Tooltip>
				<Icon
					name="information-outline"
					cx="text-gray-6"
				/>

				<span slot="description">
					Will update the "Desired angle" input value but will not execute
				</span>
			</Tooltip>
		</span>
		<div class="flex flex-row gap-2">
			<Button
				onclick={() => {
					desiredAngle = 0
				}}
			>
				Zero
			</Button>
			<Button
				onclick={() => {
					desiredAngle = currentPosition
				}}
			>
				Current position
			</Button>
		</div>
	</div>
	<Button
		class="w-fit"
		icon="play-circle-outline"
		variant="dark"
		onclick={() => moveTo(desiredAngle)}
	>
		Execute
	</Button>
</div>
<ErrorDisplay {lastError} />
