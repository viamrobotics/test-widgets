<script lang="ts">
	import { TextField } from '@viamrobotics/prime-controls'
	import { BoardClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import HeldBack from '#lib/components/HeldBack.svelte'
	import { formatNumeric } from '#lib/format.js'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const MISSING_VALUE = '-'
	const MISSING_NAME_REASON = 'Enter an analog reader name.'
	const READER_PLACEHOLDER = 'a1'
	const PERCENT = 100

	interface AnalogReading {
		value: number
		minRange: number
		maxRange: number
		stepSize: number
	}

	const client = createResourceClient(
		BoardClient,
		() => partID,
		() => resourceName
	)

	// A read the user asks for, so it is a mutation rather than a polled query.
	const readMutation = createResourceMutation(client, 'readAnalogReader')

	let reader = $state('')
	let latestReading = $state.raw<{ reader: string; value: AnalogReading }>()

	const trimmedReader = $derived(reader.trim())
	const blockedReason = $derived(trimmedReader === '' ? MISSING_NAME_REASON : undefined)
	// A reading belongs to the reader it came from, so it hides when the reader changes.
	const reading = $derived(
		latestReading?.reader === trimmedReader ? latestReading.value : undefined
	)
	const hasRange = $derived(reading !== undefined && reading.maxRange > reading.minRange)

	const markerPercent = $derived.by(() => {
		if (reading === undefined || !hasRange) return 0
		const span = reading.maxRange - reading.minRange
		const fraction = (reading.value - reading.minRange) / span
		return Math.min(PERCENT, Math.max(0, fraction * PERCENT))
	})

	const formatReadingValue = (value: number | undefined) =>
		value === undefined ? MISSING_VALUE : formatNumeric(value, 0)

	const read = async () => {
		if (trimmedReader === '') return
		const readerToRead = trimmedReader
		try {
			const response = await readMutation.mutateAsync([readerToRead])
			latestReading = { reader: readerToRead, value: response }
		} catch {
			// The mutation's error reaches the section's indicator.
		}
	}
</script>

<ApiSection
	class="flex-col gap-2"
	method="ReadAnalogReader"
	api={ResourceTriplets.Board}
	mutations={[readMutation]}
>
	<div class="flex flex-wrap items-end gap-2">
		<TextField
			class="min-w-40 flex-1"
			label="Analog reader"
			placeholder={READER_PLACEHOLDER}
			bind:value={reader}
		/>
		<div class="ml-auto">
			<HeldBack reason={blockedReason}>
				{#snippet children(heldBack)}
					<button
						type="button"
						class="button button-compact"
						{...heldBack}
						onclick={read}
					>
						Get
					</button>
				{/snippet}
			</HeldBack>
		</div>
	</div>
	<div
		role="group"
		aria-label="Value"
		class="flex items-center gap-2"
	>
		<span class="text-subtle-1 text-xs">Value</span>
		<output class="readout font-roboto-mono">
			<span class="readout-value">{formatReadingValue(reading?.value)}</span>
		</output>
	</div>
	{#if reading !== undefined && hasRange}
		<div
			role="group"
			aria-label="Range"
			class="flex flex-col gap-1"
		>
			<span class="text-subtle-1 text-xs">Range</span>
			<div
				aria-hidden="true"
				class="bg-gray-3 relative mt-1 h-1 rounded-sm"
			>
				<span
					class="bg-gray-8 absolute -top-0.5 h-2 w-0.5"
					style:left="{markerPercent}%"
				></span>
			</div>
			<div class="text-subtle-2 flex justify-between text-xs">
				<span>{formatReadingValue(reading.minRange)}</span>
				<span>{formatReadingValue(reading.maxRange)}</span>
			</div>
		</div>
	{/if}
	<div
		role="group"
		aria-label="Step size"
		class="flex items-center gap-2"
	>
		<span class="text-subtle-1 text-xs">Step size</span>
		<output class="readout font-roboto-mono">
			<span class="readout-value">{formatReadingValue(reading?.stepSize)}</span>
		</output>
	</div>
</ApiSection>
