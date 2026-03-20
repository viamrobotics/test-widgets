<script lang="ts">
	import { formatNumeric } from '$lib/format';
	import ConfirmingButton from './confirming-button.svelte';
	import PinSection from './pin-section.svelte';

	interface Props {
		value: number | undefined;
		getValue: () => void;
	}

	const { value, getValue }: Props = $props();

	const id = $props.id();
	const sectionId = `${id}-section`;
	const getButtonId = `${id}-get`;
</script>

<PinSection
	title="Read pin"
	class="h-fit"
>
	<section
		class="flex h-full max-h-18.5 w-full flex-col gap-1 p-3 text-xs"
		aria-labelledby={sectionId}
	>
		<h5
			id={sectionId}
			class="text-subtle-1"
		>
			Value
		</h5>
		<span class="flex w-full place-content-between content-stretch">
			<output
				class={[
					'my-auto',
					{
						'text-disabled': value === undefined
					}
				]}
				for={getButtonId}
			>
				{formatNumeric(value, 0)}
			</output>

			<ConfirmingButton
				onclick={getValue}
				id={getButtonId}
				class="w-full max-w-11"
			>
				Get
			</ConfirmingButton>
		</span>
	</section>
</PinSection>
