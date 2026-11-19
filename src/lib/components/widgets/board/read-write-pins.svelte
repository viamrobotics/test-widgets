<script lang="ts">
	import { dedupeErrors, Section } from '$lib/components/section'

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

	const errors = $derived(dedupeErrors([currentError]))

	const setLastError = (error: Error | null) => {
		currentError = error
	}

	const handleChangedPinSelection = (selection: PinSelection) => {
		pinSelection = selection
	}
</script>

<div class="@container flex w-full flex-col gap-2 p-2">
	<Section.Heading>
		Pins
		{#snippet aside()}
			<Section.Errors {errors} />
		{/snippet}
	</Section.Heading>
	<!-- @lg, 512 px, is where the body beside a 160 px selector and a 24 px gap keeps its 302 px stacked width. -->
	<div class="flex flex-col gap-2 @lg:flex-row @lg:items-start @lg:gap-6">
		<PinSelector
			class="@lg:w-40 @lg:flex-none"
			value={pinSelection}
			onChange={handleChangedPinSelection}
		/>
		<div class="border-gray-3 min-w-0 flex-1 border-t pt-2 @lg:border-t-0 @lg:pt-0">
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
	</div>
</div>
