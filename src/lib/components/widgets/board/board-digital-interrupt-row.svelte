<!--
@component
One named digital interrupt in `BoardControls`: its polled count. Reads only. Status text goes to
`onStatusChange` and every error to the enclosing section's indicator.
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
			aria-label={`Remove digital interrupt ${name}`}
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
				<span class="readout-value">{countText}</span>
			</output>
		</div>
		{#if countQuery.isError}
			<button
				type="button"
				class="button button-xs"
				aria-label={`Retry value of digital interrupt ${name}`}
				onclick={retry}
			>
				Retry
			</button>
		{/if}
	</div>
</div>
