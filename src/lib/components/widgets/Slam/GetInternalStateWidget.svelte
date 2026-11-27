<script lang="ts">
	import { SlamClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import HeldBack from '#lib/components/HeldBack.svelte'
	import StatusLine from '#lib/components/StatusLine.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const MISSING_VALUE = '-'
	const BYTES_PER_KB = 1024
	const KB_DIGITS = 1
	const FALLBACK_FILE_EXTENSION = 'bin'
	const BUSY_REASON = 'Wait for the download in flight to finish.'

	const client = createResourceClient(
		SlamClient,
		() => partID,
		() => resourceName
	)

	// Same query and options as GetProperties, so the query cache shares one request.
	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: false })

	// The internal state is large, so it is fetched only when the button is pressed.
	const internalStateQuery = createResourceQuery(client, 'getInternalState', {
		enabled: false,
		refetchInterval: false,
	})

	let lastDownloadBytes = $state<number>()

	const lastDownloadText = $derived(
		lastDownloadBytes === undefined
			? MISSING_VALUE
			: (lastDownloadBytes / BYTES_PER_KB).toFixed(KB_DIGITS)
	)

	const hasDownloaded = $derived(lastDownloadBytes !== undefined)

	const fileExtension = $derived.by(() => {
		const fileType = propertiesQuery.data?.internalStateFileType ?? ''
		const withoutDot = fileType.replace(/^\./u, '')
		return withoutDot === '' ? FALLBACK_FILE_EXTENSION : withoutDot
	})

	const saveInternalState = (internalState: Uint8Array) => {
		const blob = new Blob([new Uint8Array(internalState)], { type: 'application/octet-stream' })
		const url = URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.href = url
		link.download = `${resourceName}-internal-state.${fileExtension}`
		link.click()
		URL.revokeObjectURL(url)
	}

	let hasLastDownloadFailed = $state(false)

	// The button stays focusable while a download is in flight, so a press then is dropped here.
	const downloadInternalState = async () => {
		if (internalStateQuery.isFetching) return
		hasLastDownloadFailed = false
		const result = await internalStateQuery.refetch()
		if (result.isError || result.data === undefined) {
			hasLastDownloadFailed = true
			return
		}
		saveInternalState(result.data)
		lastDownloadBytes = result.data.byteLength
	}

	const statusText = $derived.by(() => {
		if (internalStateQuery.isFetching) return 'Downloading internal state.'
		return hasLastDownloadFailed ? 'Download internal state failed' : ''
	})

	const lastDownloadLabelId = $props.id()
</script>

<ApiSection
	method="GetInternalState"
	api={ResourceTriplets.Slam}
	queries={[internalStateQuery]}
	class="grow flex-col gap-2"
>
	<div class="flex items-start">
		<HeldBack reason={internalStateQuery.isFetching ? BUSY_REASON : undefined}>
			{#snippet children(heldBack)}
				<button
					type="button"
					class="button button-compact"
					{...heldBack}
					onclick={downloadInternalState}
				>
					Download internal state
				</button>
			{/snippet}
		</HeldBack>
	</div>
	<StatusLine text={statusText} />
	<div class="flex min-w-0 items-center gap-2">
		<span
			id={lastDownloadLabelId}
			class="text-subtle-1 truncate text-xs"
		>
			Last download
		</span>
		<span
			role="group"
			aria-labelledby={lastDownloadLabelId}
			class="readout font-roboto-mono"
		>
			<span class="readout-value">{lastDownloadText}</span>
			{#if hasDownloaded}
				<span class="readout-suffix">KB</span>
			{/if}
		</span>
	</div>
</ApiSection>
