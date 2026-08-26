<script lang="ts">
	import ErrorDisplay from '$lib/components/error.svelte'

	import AnalogReadWrapper from './analog-read-wrapper.svelte'
	import AnalogWriteWrapper from './analog-write-wrapper.svelte'
	import { PinModes, type PinSelection, PinTypes } from './board.ts'
	import GpioReadWrapper from './gpio-read-wrapper.svelte'
	import GpioWriteWrapper from './gpio-write-wrapper.svelte'
	import PinSelector from './pin-selector.svelte'

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
	<ErrorDisplay lastError={currentError} />
</div>
