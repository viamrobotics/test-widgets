<!--
@component
One named digital interrupt in `Board.DigitalInterrupt`'s list: its polled count. Reads only.
Status text goes to `onStatusChange` and every error to the enclosing section's indicator.
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

	const interruptArgs = (): [name: string] => [name]
	const pollOptions = (): { refetchInterval: number | false } => ({
		refetchInterval: isPolling ? POLL_MS : false,
	})

	const countQuery = createResourceQuery(
		client,
		'getDigitalInterruptValue',
		interruptArgs,
		pollOptions
	)

	useReportedError(() => countQuery.error)

	$effect(() => {
		if (countQuery.isError) isPolling = false
	})

	const retry = async () => {
		const result = await countQuery.refetch()
		if (result.isSuccess) isPolling = true
	}

	const countText = $derived(
		countQuery.isError || countQuery.data === undefined
			? MISSING_VALUE
			: formatNumeric(countQuery.data, 0)
	)

	const statusText = $derived(countQuery.isError ? `${name} is not polling` : '')

	$effect(() => {
		onStatusChange(statusText)
	})
</script>

<BoardNamedEntry
	{name}
	removeLabel={`Remove digital interrupt ${name}`}
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
				<span class="readout-value">{countText}</span>
			</output>
		</div>
		{#if countQuery.isError}
			<button
				type="button"
				class="button button-xs"
				aria-label={`Retry value of digital interrupt ${name}`}
				onclick={(event) => retryKeepingFocus(event.currentTarget, retry, () => readout)}
			>
				Retry
			</button>
		{/if}
	</div>
</BoardNamedEntry>
