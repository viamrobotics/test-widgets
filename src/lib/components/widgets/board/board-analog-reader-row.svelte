<!--
@component
One named analog reader in `BoardControls`: its polled value on a range track from the reader's
minimum to maximum. Reads only. Status text goes to `onStatusChange` and every error to the
enclosing section's indicator.
-->
<script lang="ts">
	import { mdiClose } from '@mdi/js'
	import { Icon } from '@viamrobotics/prime-ui'
	import { BoardClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import { useReportedError } from '$lib/components/media-frame/use-reported-error.svelte'
	import { formatNumeric } from '$lib/format'

	import type { BoardNamedRowProps } from './board-control-row-props'

	const { partID, resourceName, name, onRemove, onStatusChange }: BoardNamedRowProps = $props()

	const POLL_MS = 1000
	const PERCENT = 100
	const MISSING_VALUE = '-'

	const id = $props.id()
	const nameId = `${id}-name`
	const valueLabelId = `${id}-value`

	const client = createResourceClient(
		BoardClient,
		() => partID,
		() => resourceName
	)

	// A failed read stops this row's poll. Retry starts it again once a read succeeds.
	let isPolling = $state(true)

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

<div
	role="group"
	aria-labelledby={nameId}
	class="border-light flex min-w-0 flex-col gap-1 border-t pt-2"
>
	<div class="flex items-center gap-1">
		<h5
			id={nameId}
			class="min-w-0 flex-1 truncate text-xs font-semibold"
		>
			<span class="font-roboto-mono">{name}</span>
		</h5>
		<button
			type="button"
			class="icon-button size-6"
			aria-label={`Remove analog reader ${name}`}
			onclick={onRemove}
		>
			<Icon
				icon={mdiClose}
				size="sm"
			/>
		</button>
	</div>

	<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
		<div class="flex min-w-19 flex-1 items-center gap-1">
			<span
				id={valueLabelId}
				class="text-subtle-1 shrink-0 text-xs"
			>
				Value
			</span>
			<output
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
				onclick={retry}
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
</div>
