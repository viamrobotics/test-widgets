<script lang="ts">
	import { Label, NumericInput, ToggleButtons } from '@viamrobotics/prime-core';

	import { numberValueFromEvent } from '$lib/event-handlers';
	import ConfirmingButton from './confirming-button.svelte';
	import PinSection from './pin-section.svelte';

	interface Props {
		setState: (high: boolean) => void;
		setDutyCycle: (dutyCyclePct: number) => void;
		setFrequency: (frequencyHz: number) => void;
	}

	const { setState, setDutyCycle, setFrequency }: Props = $props();

	let desiredPinState: 'High' | 'Low' = $state('High');
	let desiredDutyCycle = $state(0);
	let desiredFrequency = $state(0);

	const changePinState = (event: CustomEvent<string>) => {
		desiredPinState = event.detail as 'High' | 'Low';
	};
</script>

<PinSection title="Write pin">
	<div class="flex w-full p-3 text-xs">
		<ToggleButtons
			cx="w-fit!"
			options={['High', 'Low']}
			selected={desiredPinState}
			on:input={changePinState}
		>
			{#snippet legend()}
				State
			{/snippet}
		</ToggleButtons>
		<ConfirmingButton
			class="mt-auto ml-auto w-full max-w-11"
			onclick={() => {
				setState(desiredPinState === 'High');
			}}
		>
			Set
		</ConfirmingButton>
	</div>
	<div class="flex h-full max-h-35 flex-col gap-4 p-3">
		<div class="relative flex w-full">
			<Label cx="w-fit!">
				<h5>
					PWM duty cycle
					<abbr class="text-disabled">(0-100%)</abbr>
				</h5>

				<NumericInput
					slot="input"
					cx="max-w-[124px]"
					value={desiredDutyCycle}
					placeholder="0"
					step={1}
					on:change={(event) => {
						desiredDutyCycle = numberValueFromEvent(event) ?? 0;
					}}
				/>
			</Label>
			<!-- NOTE(zp,2024-06-27) This is absolute because the label text overflows the input
          and would push the button out of the parent container-->
			<ConfirmingButton
				class="absolute right-0 bottom-0 w-full max-w-11"
				onclick={() => {
					// Duty cycle is displayed as [0, 100] but [0, 1] values are expected
					setDutyCycle(desiredDutyCycle / 100);
				}}
			>
				Set
			</ConfirmingButton>
		</div>
		<div class="flex w-full">
			<Label>
				<h5>
					PWM frequency
					<abbr class="text-disabled">(Hz)</abbr>
				</h5>

				<NumericInput
					slot="input"
					value={desiredFrequency}
					cx="max-w-[124px]"
					placeholder="0"
					step={0.01}
					on:change={(event) => {
						desiredFrequency = numberValueFromEvent(event) ?? 0;
					}}
				/>
			</Label>
			<ConfirmingButton
				class="mt-auto ml-auto w-full max-w-11"
				onclick={() => {
					setFrequency(desiredFrequency);
				}}
			>
				Set
			</ConfirmingButton>
		</div>
	</div>
</PinSection>
