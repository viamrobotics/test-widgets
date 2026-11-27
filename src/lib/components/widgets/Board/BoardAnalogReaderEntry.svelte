<!--
@component
One named analog reader in `Board.AnalogReader`'s list: its polled value on a range track from the
reader's minimum to maximum. Reads only. Status text goes to `onStatusChange` and every error to the
enclosing section's indicator.
-->
<script lang="ts">
	import { BoardClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import { useReportedError } from '#lib/components/MediaFrame/use-reported-error.svelte.js'
	import { formatNumeric } from '#lib/format.js'

	import type { BoardNameEntryProps } from './board-name-entry-props'

	import BoardNamedEntry from './BoardNamedEntry.svelte'
	import { retryKeepingFocus } from './retry-keeping-focus'

	const { partID, resourceName, name, onRemove, onStatusChange }: BoardNameEntryProps = $props()

	const POLL_MS = 1000
	const PERCENT = 100
	const MISSING_VALUE = '-'

	const id = $props.id()
	const valueLabelId = `${id}-value`

	const client = createResourceClient(
		BoardClient,
		() => partID,
		() => resourceName
	)

	// A failed read stops this row's poll. Retry starts it again once a read succeeds.
	let isPolling = $state(true)
	let readout = $state<HTMLOutputElement>()

	const readerArgs = (): [name: string] => [name]
	const pollOptions = (): { refetchInterval: number | false } => ({
		refetchInterval: isPolling ? POLL_MS : false,
	})

	const readQuery = createResourceQuery(client, 'readAnalogReader', readerArgs, pollOptions)

	useReportedError(() => readQuery.error)

	$effect(() => {
		if (readQuery.isError) isPolling = false
	})

	const retry = async () => {
		const result = await readQuery.refetch()
		if (result.isSuccess) isPolling = true
	}

	const reading = $derived(readQuery.isError ? undefined : readQuery.data)
	const hasRange = $derived(reading !== undefined && reading.maxRange > reading.minRange)

	const markerPercent = $derived.by(() => {
		if (reading === undefined || !hasRange) return 0
		const fraction = (reading.value - reading.minRange) / (reading.maxRange - reading.minRange)
		return Math.min(PERCENT, Math.max(0, fraction * PERCENT))
	})

	const formatReading = (value: number | undefined) =>
		value === undefined ? MISSING_VALUE : formatNumeric(value, 0)

	const statusText = $derived(readQuery.isError ? `${name} is not polling` : '')

	$effect(() => {
		onStatusChange(statusText)
	})
</script>

<BoardNamedEntry
	{name}
	removeLabel={`Remove analog reader ${name}`}
	{onRemove}
>
	<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
		<div class="flex min-w-19 flex-1 items-center gap-1">
			<span
				id={valueLabelId}
				class="text-subtle-1 shrink-0 text-xs"
			>
				Value
			</span>
			<output
				bind:this={readout}
				tabindex="-1"
				class="readout font-roboto-mono"
				aria-labelledby={valueLabelId}
			>
				<span class="readout-value">{formatReading(reading?.value)}</span>
			</output>
		</div>
		{#if readQuery.isError}
			<button
				type="button"
				class="button button-xs"
				aria-label={`Retry value of analog reader ${name}`}
				onclick={(event) => retryKeepingFocus(event.currentTarget, retry, () => readout)}
			>
				Retry
			</button>
		{/if}
	</div>

	{#if reading !== undefined && hasRange}
		<div
			role="group"
			aria-label={`Range of analog reader ${name}`}
			class="flex flex-col gap-1"
		>
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
				<span>{formatReading(reading.minRange)}</span>
				<span>{formatReading(reading.maxRange)}</span>
			</div>
		</div>
	{/if}
</BoardNamedEntry>
