<script lang="ts">
	import { mdiDownload, mdiPlayCircleOutline, mdiStopCircleOutline } from '@mdi/js'
	import { NumberField, Select, TextField } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'
	import { AudioInClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import CopyButton from '#lib/components/CopyButton.svelte'
	import { emptyOnClear } from '#lib/components/empty-on-clear.js'
	import HeldBack from '#lib/components/HeldBack.svelte'
	import ReadoutRow from '#lib/components/ReadoutRow.svelte'
	import StatusLine from '#lib/components/StatusLine.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import { createAudioCapturer } from './create-audio-capturer.svelte.ts'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const BYTES_PER_KB = 1024
	const DEFAULT_CODEC = 'pcm16'
	const DURATION_HINT = 'Enter a duration of 0 or more.'
	const TIMESTAMP_HINT = 'Enter the previous timestamp as whole nanoseconds.'

	const client = createResourceClient(
		AudioInClient,
		() => partID,
		() => resourceName
	)

	// The codecs do not change while the device runs, so they are read once.
	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: false })

	const capture = createAudioCapturer(client)

	let pickedCodec = $state('')
	let duration = $state<number | undefined>(3)
	let previousTimestamp = $state('')

	const codecs = $derived.by(() => {
		const supported = propertiesQuery.data?.supportedCodecs ?? []
		return supported.length > 0 ? supported : [DEFAULT_CODEC]
	})
	const codecItems = $derived(codecs.map((codec) => ({ value: codec, label: codec })))
	const selectedCodec = $derived(codecs.includes(pickedCodec) ? pickedCodec : codecs[0]!)

	const setCodec = (next: string | undefined) => {
		if (next !== undefined) pickedCodec = next
	}

	// Empty text starts from the beginning. Anything but whole digits is not a timestamp.
	const parsedTimestamp = $derived.by(() => {
		const text = previousTimestamp.trim()
		if (text === '') return 0n
		return /^\d+$/u.test(text) ? BigInt(text) : undefined
	})

	const validDuration = $derived(
		duration !== undefined && Number.isFinite(duration) && duration >= 0 ? duration : undefined
	)

	const isStreaming = $derived(capture.status === 'recording')

	const blockedReason = $derived.by(() => {
		if (client.current === undefined) return 'The audio input is not connected.'
		if (validDuration === undefined) return DURATION_HINT
		return parsedTimestamp === undefined ? TIMESTAMP_HINT : undefined
	})

	// The button stays focusable while held back, so a press then is dropped here.
	const startCapture = () => {
		if (isStreaming || blockedReason !== undefined) return
		if (parsedTimestamp === undefined || validDuration === undefined) return
		void capture.start(selectedCodec, validDuration, parsedTimestamp)
	}

	const labelId = $props.id()

	const kilobytesText = $derived(
		capture.chunkCount > 0 ? (capture.totalBytes / BYTES_PER_KB).toFixed(1) : undefined
	)
	const info = $derived(capture.audioInfo)
	const lastChunk = $derived(capture.lastChunk)
	const endTimestampText = $derived(lastChunk && String(lastChunk.endTimeNs))
	const hasReadouts = $derived(capture.status !== 'idle')

	const statusText = $derived.by(() => {
		if (isStreaming) return 'Capturing.'
		return capture.status === 'error' ? 'Capture failed' : ''
	})
</script>

<ApiSection
	method="GetAudio"
	api={ResourceTriplets.AudioInput}
	queries={[propertiesQuery]}
	mutations={[capture]}
	class="grow flex-col gap-2"
>
	<div class="flex w-full flex-col gap-1">
		<div class="flex min-w-0 items-center gap-2">
			<span
				id={labelId}
				class="text-subtle-1 w-31 shrink-0 text-xs"
			>
				Codec
			</span>
			<div class="min-w-0 flex-1">
				<Select
					items={codecItems}
					bind:value={() => selectedCodec, setCodec}
					aria-labelledby={labelId}
					disabled={isStreaming}
				/>
			</div>
		</div>
		<NumberField
			label="Duration"
			hint={validDuration === undefined ? DURATION_HINT : '0 streams until stopped'}
			suffix="s"
			min={0}
			disabled={isStreaming}
			state={validDuration === undefined ? 'error' : undefined}
			{...emptyOnClear(() => (duration = undefined))}
			bind:value={duration}
		/>
		<TextField
			label="Previous timestamp"
			hint={parsedTimestamp === undefined
				? TIMESTAMP_HINT
				: 'In nanoseconds (ns). Empty starts from the beginning.'}
			placeholder="ns"
			disabled={isStreaming}
			state={parsedTimestamp === undefined ? 'error' : undefined}
			bind:value={previousTimestamp}
		/>
		<div class="flex justify-end">
			<!-- One button for both states, so keyboard focus stays on it when the capture starts or ends. -->
			<HeldBack reason={isStreaming ? undefined : blockedReason}>
				{#snippet children(heldBack)}
					<button
						type="button"
						class="button button-compact"
						{...heldBack}
						onclick={isStreaming ? capture.stop : startCapture}
					>
						<Icon icon={isStreaming ? mdiStopCircleOutline : mdiPlayCircleOutline} />
						{isStreaming ? 'Stop' : 'Start capture'}
					</button>
				{/snippet}
			</HeldBack>
		</div>
		<StatusLine text={statusText} />
	</div>

	{#if hasReadouts}
		<div
			role="group"
			aria-label="Capture"
			class="flex flex-col gap-1"
		>
			<ReadoutRow
				label="Captured"
				value={kilobytesText}
				suffix="KB"
			/>
			<ReadoutRow
				label="Chunks"
				value={String(capture.chunkCount)}
			/>
			<ReadoutRow
				label="Codec"
				value={info?.codec}
			/>
			<ReadoutRow
				label="Sample rate"
				value={info && String(info.sampleRateHz)}
				suffix="Hz"
			/>
			<ReadoutRow
				label="Channels"
				value={info && String(info.numChannels)}
			/>
		</div>
		<div
			role="group"
			aria-label="Last chunk"
			class="flex flex-col gap-1"
		>
			<span class="text-xs font-semibold">Last chunk</span>
			<ReadoutRow
				label="Sequence"
				value={lastChunk && String(lastChunk.sequence)}
			/>
			<ReadoutRow
				label="Size"
				value={lastChunk && String(lastChunk.byteLength)}
				suffix="B"
			/>
			<ReadoutRow
				label="Request ID"
				value={lastChunk?.requestID || undefined}
			/>
			<ReadoutRow
				label="Start timestamp"
				value={lastChunk && String(lastChunk.startTimeNs)}
				suffix="ns"
			/>
			<ReadoutRow
				label="End timestamp"
				value={endTimestampText}
				suffix="ns"
			>
				{#if endTimestampText !== undefined}
					<CopyButton
						data={endTimestampText}
						ariaLabel="Copy end timestamp"
					/>
				{/if}
			</ReadoutRow>
		</div>
	{/if}

	{#if capture.downloadUrl && !isStreaming}
		<div class="flex justify-end">
			<a
				href={capture.downloadUrl}
				download="audio-capture.{capture.codec ?? selectedCodec}"
				rel="external"
				class="button button-compact"
			>
				<Icon icon={mdiDownload} />
				Download
			</a>
		</div>
	{/if}
</ApiSection>
