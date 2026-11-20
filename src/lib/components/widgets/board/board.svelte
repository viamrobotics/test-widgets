<script lang="ts">
	import ConnectionStatus from '$lib/components/connection-status.svelte'

	import GetDigitalInterruptValueWidget from './get-digital-interrupt-value-widget.svelte'
	import GetGpioWidget from './get-gpio-widget.svelte'
	import PwmFrequencyWidget from './pwm-frequency-widget.svelte'
	import PwmWidget from './pwm-widget.svelte'
	import ReadAnalogReaderWidget from './read-analog-reader-widget.svelte'
	import SetGpioWidget from './set-gpio-widget.svelte'
	import SetPowerModeWidget from './set-power-mode-widget.svelte'
	import SetPwmFrequencyWidget from './set-pwm-frequency-widget.svelte'
	import SetPwmWidget from './set-pwm-widget.svelte'
	import SharedPinField from './shared-pin-field.svelte'
	import StreamTicksWidget from './stream-ticks-widget.svelte'
	import WriteAnalogWidget from './write-analog-widget.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	let sharedPin = $state('')

	const pin = $derived(sharedPin.trim())

	// 224 steps of 4 px is 896 px, where the third column is the last one worth drawing.
	const LAYER_GRID_CLASS =
		'grid grid-cols-1 border-t border-light @2xl:grid-cols-2 @4xl:grid-cols-3 *:min-w-0 *:*:grow *:border-b *:border-light @2xl:*:border-r @2xl:*:nth-[2n]:border-r-0 @4xl:*:nth-[2n]:border-r @4xl:*:nth-[3n]:border-r-0'
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="@container mx-auto max-w-4xl">
			<SharedPinField bind:value={sharedPin} />

			<div
				role="group"
				aria-label="Mutators"
				class={LAYER_GRID_CLASS}
			>
				<div class="flex flex-col">
					<SetGpioWidget
						{partID}
						{resourceName}
						{pin}
					/>
				</div>
				<div class="flex flex-col">
					<SetPwmWidget
						{partID}
						{resourceName}
						{pin}
					/>
				</div>
				<div class="flex flex-col">
					<SetPwmFrequencyWidget
						{partID}
						{resourceName}
						{pin}
					/>
				</div>
				<div class="flex flex-col">
					<WriteAnalogWidget
						{partID}
						{resourceName}
						{pin}
					/>
				</div>
				<div class="flex flex-col">
					<SetPowerModeWidget
						{partID}
						{resourceName}
					/>
				</div>
				<div
					aria-hidden="true"
					class="hidden @2xl:block"
				></div>
			</div>

			<div
				role="group"
				aria-label="Queries"
				class={LAYER_GRID_CLASS}
			>
				<div class="flex flex-col">
					<GetGpioWidget
						{partID}
						{resourceName}
						{pin}
					/>
				</div>
				<div class="flex flex-col">
					<PwmWidget
						{partID}
						{resourceName}
						{pin}
					/>
				</div>
				<div class="flex flex-col">
					<PwmFrequencyWidget
						{partID}
						{resourceName}
						{pin}
					/>
				</div>
				<div class="flex flex-col">
					<ReadAnalogReaderWidget
						{partID}
						{resourceName}
					/>
				</div>
				<div class="flex flex-col">
					<GetDigitalInterruptValueWidget
						{partID}
						{resourceName}
					/>
				</div>
				<div class="flex flex-col">
					<StreamTicksWidget
						{partID}
						{resourceName}
					/>
				</div>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>
