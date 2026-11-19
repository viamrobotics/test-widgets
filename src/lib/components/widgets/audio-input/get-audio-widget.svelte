<script lang="ts">
	import { mdiDownload, mdiPlayCircleOutline, mdiStopCircleOutline } from '@mdi/js'
	import { NumberField, Select, TextField } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'
	import { AudioInClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import CopyButton from '$lib/components/copy-button.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import { createAudioCapturer } from './create-audio-capturer.svelte.ts'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const MISSING_VALUE = '-'
	const BYTES_PER_KB = 1024
	const DEFAULT_CODEC = 'pcm16'

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
	const canStart = $derived(
		client.current !== undefined && parsedTimestamp !== undefined && validDuration !== undefined
	)

	const startCapture = () => {
		if (isStreaming || parsedTimestamp === undefined || validDuration === undefined) return
		void capture.start(selectedCodec, validDuration, parsedTimestamp)
	}

	const labelId = $props.id()

	const kilobytesText = $derived(
		capture.chunkCount > 0 ? (capture.totalBytes / BYTES_PER_KB).toFixed(1) : MISSING_VALUE
	)
	const info = $derived(capture.audioInfo)
	const endTimestampText = $derived(
		capture.endTimestamp === undefined ? MISSING_VALUE : String(capture.endTimestamp)
	)
	const hasReadouts = $derived(capture.status !== 'idle')
</script>

{#snippet readout(label: string, text: string, suffix?: string)}
	<div class="flex min-w-0 items-center gap-2">
		<span class="text-subtle-1 w-31 shrink-0 truncate text-xs">{label}</span>
		<span class="readout font-roboto-mono">
			<span class="readout-value">{text}</span>
			{#if suffix !== undefined && text !== MISSING_VALUE}
				<span class="readout-suffix">{suffix}</span>
			{/if}
		</span>
	</div>
{/snippet}

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
				class="text-subtle-1 w-28 shrink-0 text-xs"
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
			hint="0 streams until stopped"
			suffix="s"
			min={0}
			disabled={isStreaming}
			state={validDuration === undefined ? 'error' : undefined}
			bind:value={duration}
		/>
		<TextField
			label="Previous timestamp"
			hint="In nanoseconds (ns). Empty starts from the beginning."
			placeholder="ns"
			disabled={isStreaming}
			state={parsedTimestamp === undefined ? 'error' : undefined}
			bind:value={previousTimestamp}
		/>
		<div class="flex justify-end">
			{#if isStreaming}
				<button
					type="button"
					class="button button-compact"
					onclick={capture.stop}
				>
					<Icon icon={mdiStopCircleOutline} />
					Stop
				</button>
			{:else}
				<button
					type="button"
					class="button button-compact"
					disabled={!canStart}
					onclick={startCapture}
				>
					<Icon icon={mdiPlayCircleOutline} />
					Start capture
				</button>
			{/if}
		</div>
	</div>

	{#if hasReadouts}
		<div
			role="group"
			aria-label="Capture"
			class="flex flex-col gap-1"
		>
			{@render readout('Captured', kilobytesText, 'KB')}
			{@render readout('Chunks', String(capture.chunkCount))}
			{@render readout('Codec', info?.codec ?? MISSING_VALUE)}
			{@render readout(
				'Sample rate',
				info === undefined ? MISSING_VALUE : String(info.sampleRateHz),
				'Hz'
			)}
			{@render readout('Channels', info === undefined ? MISSING_VALUE : String(info.numChannels))}
			<div class="flex min-w-0 items-center gap-2">
				<span class="text-subtle-1 w-31 shrink-0 truncate text-xs">End timestamp</span>
				<span class="readout font-roboto-mono min-w-0 truncate">
					<span class="readout-value">{endTimestampText}</span>
					{#if capture.endTimestamp !== undefined}
						<span class="readout-suffix">ns</span>
					{/if}
				</span>
				{#if capture.endTimestamp !== undefined}
					<CopyButton
						data={endTimestampText}
						ariaLabel="Copy end timestamp"
					/>
				{/if}
			</div>
		</div>
	{/if}

	{#if capture.downloadUrl && !isStreaming}
		<div class="flex justify-end">
			<a
				href={capture.downloadUrl}
				download="audio-capture.{selectedCodec}"
				rel="external"
				class="button button-compact"
			>
				<Icon icon={mdiDownload} />
				Download
			</a>
		</div>
	{/if}
</ApiSection>
