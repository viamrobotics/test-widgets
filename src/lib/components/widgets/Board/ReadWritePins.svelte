<script lang="ts">
	import { Section } from '#lib/components/Section/index.js'

	import AnalogReadWrapper from './AnalogReadWrapper.svelte'
	import AnalogWriteWrapper from './AnalogWriteWrapper.svelte'
	import { PinModes, type PinSelection, PinTypes } from './board.ts'
	import GpioReadWrapper from './GpioReadWrapper.svelte'
	import GpioWriteWrapper from './GpioWriteWrapper.svelte'
	import PinSelector from './PinSelector.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	let pinSelection: PinSelection = $state({
		pin: '',
		type: PinTypes.GPIO,
		mode: PinModes.WRITE,
	})

	let currentError: Error | null = $state(null)

	const setLastError = (err: Error | null) => {
		currentError = err
	}

	const handleChangedPinSelection = (newVal: PinSelection) => {
		pinSelection = newVal
	}
</script>

<div class="flex w-full flex-col gap-6">
	<div class="flex w-full flex-wrap gap-x-16 gap-y-6">
		<PinSelector
			value={pinSelection}
			onChange={handleChangedPinSelection}
		/>
		{#if pinSelection.type === PinTypes.GPIO && pinSelection.mode === PinModes.READ}
			<GpioReadWrapper
				pin={pinSelection.pin}
				{partID}
				{resourceName}
				{setLastError}
			/>
		{:else if pinSelection.type === PinTypes.GPIO && pinSelection.mode === PinModes.WRITE}
			<GpioWriteWrapper
				pin={pinSelection.pin}
				{partID}
				{resourceName}
				{setLastError}
			/>
		{:else if pinSelection.type === PinTypes.ANALOG && pinSelection.mode === PinModes.READ}
			<AnalogReadWrapper
				pin={pinSelection.pin}
				{partID}
				{resourceName}
				{setLastError}
			/>
		{:else if pinSelection.type === PinTypes.ANALOG && pinSelection.mode === PinModes.WRITE}
			<AnalogWriteWrapper
				pin={pinSelection.pin}
				{partID}
				{resourceName}
				{setLastError}
			/>
		{/if}
	</div>
	<Section.Error error={currentError} />
</div>
