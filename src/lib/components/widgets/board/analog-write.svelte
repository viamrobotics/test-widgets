<script lang="ts">
	import { Label, NumericInput } from '@viamrobotics/prime-core';

	import { numberValueFromEvent } from '$lib/event-handlers';
	import ConfirmingButton from './confirming-button.svelte';
	import PinSection from './pin-section.svelte';

	let value = $state(0);

	interface Props {
		setValue: (value: number) => void;
	}

	const { setValue }: Props = $props();
</script>

<PinSection
	title="Write pin"
	class="h-fit"
>
	<div class="flex h-full max-h-18.5 w-full p-3">
		<Label cx="w-fit!">
			<h5>Value</h5>

			<NumericInput
				slot="input"
				placeholder="0"
				step={0.01}
				cx="max-w-[124px]"
				{value}
				on:input={(event) => {
					value = numberValueFromEvent(event) ?? 0;
				}}
			/>
		</Label>
		<ConfirmingButton
			class="mt-auto ml-auto w-full max-w-11"
			onclick={() => setValue(value)}
		>
			Set
		</ConfirmingButton>
	</div>
</PinSection>
