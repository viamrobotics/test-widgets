<script lang="ts">
	import { formatNumeric } from '$lib/format';
	import ConfirmingButton from './confirming-button.svelte';
	import PinSection from './pin-section.svelte';

	interface Props {
		gpioState: boolean | undefined;
		pwmDutyCycle: number | undefined;
		pwmFreq: number | undefined;
		getState: () => void;
		getDutyCycle: () => void;
		getFrequency: () => void;
	}

	const { gpioState, pwmDutyCycle, pwmFreq, getState, getDutyCycle, getFrequency }: Props =
		$props();

	const id = $props.id();
	const stateSectionId = `${id}-state-section`;
	const dutySectionId = `${id}-duty-section`;
	const freqSectionId = `${id}-freq-section`;

	const stateButtonId = `${id}-state-pin-get`;
	const dutyButtonId = `${id}-duty-pin-get`;
	const freqButtonId = `${id}-freq-pin-get`;

	const formatState = (stateVal: boolean | undefined) => {
		if (stateVal === undefined) {
			return '––';
		}
		return stateVal ? 'High' : 'Low';
	};
</script>

<PinSection title="Read pin">
	<section
		class="flex h-full max-h-18.5 w-full flex-col gap-1 p-3 text-xs"
		aria-labelledby={stateSectionId}
	>
		<h5
			id={stateSectionId}
			class="text-subtle-1"
		>
			State
		</h5>
		<span class="flex w-full place-content-between content-stretch">
			<output
				class={[
					'my-auto',
					{
						'text-disabled': gpioState === undefined
					}
				]}
				for={stateButtonId}
			>
				{formatState(gpioState)}
			</output>

			<ConfirmingButton
				onclick={getState}
				id={stateButtonId}
				class="w-full max-w-11"
			>
				Get
			</ConfirmingButton>
		</span>
	</section>
	<div class="flex flex-col gap-4 p-3">
		<section
			class="flex h-full max-h-12.5 w-full flex-col gap-1 text-xs"
			aria-labelledby={dutySectionId}
		>
			<h5
				id={dutySectionId}
				class="text-subtle-1"
			>
				PWM duty cycle <abbr class="text-disabled">(0-100%)</abbr>
			</h5>

			<span class="flex w-full place-content-between content-stretch">
				<output
					class={[
						'my-auto',
						{
							'text-disabled': pwmDutyCycle === undefined
						}
					]}
					for={dutyButtonId}
				>
					{formatNumeric(pwmDutyCycle, 4)}
				</output>
				<ConfirmingButton
					onclick={getDutyCycle}
					id={dutyButtonId}
					class="w-full max-w-11"
				>
					Get
				</ConfirmingButton>
			</span>
		</section>
		<section
			class="flex h-full max-h-12.5 w-full flex-col gap-1 text-xs"
			aria-labelledby={freqSectionId}
		>
			<h5
				id={freqSectionId}
				class="text-subtle-1"
			>
				PWM frequency <abbr class="text-disabled">(Hz)</abbr>
			</h5>

			<span class="flex w-full place-content-between content-stretch">
				<output
					class={[
						'my-auto',
						{
							'text-disabled': pwmFreq === undefined
						}
					]}
					for={freqButtonId}
				>
					{formatNumeric(pwmFreq, 2)}
				</output>
				<ConfirmingButton
					onclick={getFrequency}
					id={freqButtonId}
					class="w-full max-w-11"
				>
					Get
				</ConfirmingButton>
			</span>
		</section>
	</div>
</PinSection>
