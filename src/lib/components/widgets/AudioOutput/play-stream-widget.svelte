<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { FileField, NumberField, Select, ToggleButtons } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'
	import { AudioOutClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import { untrack } from 'svelte'

	import ApiSection from '$lib/components/api-section.svelte'
	import { toError } from '$lib/components/media-frame/to-error'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import { useAudioOutputState } from './audio-output-state.svelte.ts'
	import { acceptForCodecs, codecFromFile } from './codec.ts'
	import { createAudioStream } from './create-audio-stream.svelte.ts'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const DEFAULT_CODEC = 'pcm16'
	const DEFAULT_SAMPLE_RATE_HZ = 48_000
	const DEFAULT_CHANNELS = 1
	const BYTES_PER_KILOBYTE = 1000

	const MICROPHONE = 'microphone'
	const FILE = 'file'
	const SOURCE_ITEMS = [
		{ value: MICROPHONE, label: 'Microphone' },
		{ value: FILE, label: 'File' },
	]

	const MESSAGE_CHOOSE_FILE = 'Choose an audio file to stream'
	const MESSAGE_UNSUPPORTED_FILE = 'Unsupported audio format'
	const MESSAGE_MICROPHONE_FORMAT = `The microphone streams ${DEFAULT_CODEC} with ${DEFAULT_CHANNELS} channel`
	const MESSAGE_COUNT = 'Sample rate and channels must be whole numbers of at least 1'

	const client = createResourceClient(
		AudioOutClient,
		() => partID,
		() => resourceName
	)

	// The properties only seed the defaults and do not change while the device runs.
	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: false })

	const stream = createAudioStream(client)
	const { playback } = untrack(() => useAudioOutputState(partID, resourceName))

	let readError = $state<Error | null>(null)
	const fileReadFailure = {
		get error() {
			return readError
		},
	}

	let source = $state(MICROPHONE)
	let files = $state.raw<File[]>([])
	let pickedCodec = $state('')
	// `null` is untouched, so the field shows the default. `undefined` is a cleared field.
	let sampleRateHz = $state<number | null | undefined>(null)
	let numChannels = $state<number | null | undefined>(null)

	const isFileSource = $derived(source === FILE)
	const file = $derived(files[0])
	const fileCodec = $derived(file === undefined ? undefined : codecFromFile(file))
	const isFileInvalid = $derived(isFileSource && file !== undefined && fileCodec === undefined)

	const offeredCodecs = $derived.by(() => {
		const supported = propertiesQuery.data?.supportedCodecs ?? []
		return supported.length > 0 ? supported : [DEFAULT_CODEC]
	})
	const selectedCodec = $derived(
		pickedCodec === '' ? (offeredCodecs[0] ?? DEFAULT_CODEC) : pickedCodec
	)
	const codecItems = $derived.by(() => {
		const codecs = offeredCodecs.includes(selectedCodec)
			? offeredCodecs
			: [...offeredCodecs, selectedCodec]
		return codecs.map((codec) => ({ value: codec, label: codec }))
	})
	const acceptedFileTypes = $derived(acceptForCodecs(offeredCodecs))

	const selectedSampleRateHz = $derived(
		sampleRateHz === null
			? (propertiesQuery.data?.sampleRateHz ?? DEFAULT_SAMPLE_RATE_HZ)
			: sampleRateHz
	)
	const selectedNumChannels = $derived(
		numChannels === null ? (propertiesQuery.data?.numChannels ?? DEFAULT_CHANNELS) : numChannels
	)

	const isCount = (value: number | undefined): value is number =>
		value !== undefined && Number.isInteger(value) && value >= 1
	const isSampleRateValid = $derived(isCount(selectedSampleRateHz))
	const isNumChannelsValid = $derived(isCount(selectedNumChannels))
	const isMicrophoneFormatInvalid = $derived(
		!isFileSource && (selectedCodec !== DEFAULT_CODEC || selectedNumChannels !== DEFAULT_CHANNELS)
	)

	const invalidMessage = $derived.by(() => {
		if (isFileSource && file === undefined) return MESSAGE_CHOOSE_FILE
		if (isFileInvalid) return MESSAGE_UNSUPPORTED_FILE
		if (!isSampleRateValid || !isNumChannelsValid) return MESSAGE_COUNT
		if (isMicrophoneFormatInvalid) return MESSAGE_MICROPHONE_FORMAT
		return undefined
	})

	const setSource = (next: string) => {
		source = next
	}
	const setFiles = (next: File[] | undefined) => {
		files = next ?? []
		const picked = files[0]
		const codec = picked === undefined ? undefined : codecFromFile(picked)
		if (codec !== undefined) pickedCodec = codec
	}
	const setCodec = (next: string | undefined) => {
		if (next !== undefined) pickedCodec = next
	}
	const setSampleRate = (next: number | undefined) => {
		sampleRateHz = next
	}
	const setNumChannels = (next: number | undefined) => {
		numChannels = next
	}

	const idPrefix = $props.id()
	const codecLabelId = `${idPrefix}-codec`
	const messageId = `${idPrefix}-message`
	const sentLabelId = `${idPrefix}-sent`
	const elapsedLabelId = `${idPrefix}-elapsed`

	const isStreaming = $derived(stream.status === 'streaming')
	const isStreamShown = $derived(stream.status !== 'idle')
	const isInvalid = $derived(invalidMessage !== undefined)
	const canStart = $derived(
		client.current !== undefined && !isInvalid && !isStreaming && !playback.isBusy
	)
	const sentKilobytes = $derived(Math.round(stream.sentBytes / BYTES_PER_KILOBYTE))
	const countDescribedBy = $derived(invalidMessage === MESSAGE_COUNT ? messageId : undefined)
	const startDescribedBy = $derived(isInvalid ? messageId : undefined)

	const buildFormat = () => {
		if (!isCount(selectedSampleRateHz) || !isCount(selectedNumChannels)) return undefined
		return {
			codec: selectedCodec,
			sampleRateHz: selectedSampleRateHz,
			numChannels: selectedNumChannels,
		}
	}

	const readFileBytes = async (chosen: File) => {
		try {
			return new Uint8Array(await chosen.arrayBuffer())
		} catch (error) {
			readError = toError(error)
			return undefined
		}
	}

	let latestStartRequest = 0

	$effect(() => () => {
		latestStartRequest += 1
	})

	const startStream = async () => {
		const format = buildFormat()
		if (!canStart || format === undefined) return
		readError = null
		if (!isFileSource) {
			void playback.run(() => stream.start(format, { kind: 'microphone' }))
			return
		}
		if (file === undefined) return
		latestStartRequest += 1
		const thisStartRequest = latestStartRequest
		const audioData = await readFileBytes(file)
		if (thisStartRequest !== latestStartRequest) return
		if (audioData !== undefined) {
			void playback.run(() => stream.start(format, { kind: 'file', audioData }))
		}
	}
</script>

<ApiSection
	method="PlayStream"
	api={ResourceTriplets.AudioOutput}
	queries={[propertiesQuery]}
	mutations={[stream, fileReadFailure]}
	class="grow flex-col gap-2"
>
	<div class="flex w-full flex-col gap-2">
		<ToggleButtons
			label="Source"
			items={SOURCE_ITEMS}
			bind:value={() => source, setSource}
		/>
		{#if isFileSource}
			<FileField
				label="Audio file"
				accept={acceptedFileTypes}
				state={isFileInvalid ? 'error' : undefined}
				aria-describedby={isFileInvalid ? messageId : undefined}
				bind:value={() => files, setFiles}
			/>
		{/if}
		<div class="flex min-w-0 items-center gap-2">
			<span
				id={codecLabelId}
				class="text-subtle-1 w-28 shrink-0 text-xs"
			>
				Codec
			</span>
			<div class="min-w-0 flex-1">
				<Select
					items={codecItems}
					bind:value={() => selectedCodec, setCodec}
					aria-labelledby={codecLabelId}
				/>
			</div>
		</div>
		<NumberField
			label="Sample rate"
			suffix="Hz"
			min={1}
			state={isSampleRateValid ? undefined : 'error'}
			aria-describedby={isSampleRateValid ? undefined : countDescribedBy}
			bind:value={() => selectedSampleRateHz, setSampleRate}
		/>
		<NumberField
			label="Channels"
			min={1}
			state={isNumChannelsValid ? undefined : 'error'}
			aria-describedby={isNumChannelsValid ? undefined : countDescribedBy}
			bind:value={() => selectedNumChannels, setNumChannels}
		/>
		{#if isInvalid}
			<span
				id={messageId}
				class="text-subtle-1 text-xs">{invalidMessage}</span
			>
		{/if}
		<div class="flex flex-wrap items-center gap-2">
			<button
				type="button"
				class="button button-compact"
				disabled={!canStart}
				aria-busy={isStreaming}
				aria-describedby={startDescribedBy}
				onclick={startStream}
			>
				{#if isStreaming}
					<span
						class="progress-dots"
						aria-hidden="true"
					></span>
				{:else}
					<Icon icon={mdiPlayCircleOutline} />
				{/if}
				Start stream
			</button>
			<button
				type="button"
				class="button button-compact"
				disabled={!isStreaming}
				onclick={stream.stop}
			>
				Stop
			</button>
		</div>
		{#if isStreamShown}
			<div class="flex flex-col gap-1">
				<div
					role="group"
					aria-labelledby={sentLabelId}
					class="flex min-w-0 items-center gap-2"
				>
					<span
						id={sentLabelId}
						class="text-subtle-1 w-31 shrink-0 truncate text-xs">Sent</span
					>
					<span class="readout font-roboto-mono">
						<span class="readout-value">{sentKilobytes}</span>
						<span class="readout-suffix">KB</span>
					</span>
				</div>
				<div
					role="group"
					aria-labelledby={elapsedLabelId}
					class="flex min-w-0 items-center gap-2"
				>
					<span
						id={elapsedLabelId}
						class="text-subtle-1 w-31 shrink-0 truncate text-xs">Elapsed</span
					>
					<span class="readout font-roboto-mono">
						<span class="readout-value">{stream.elapsedSeconds}</span>
						<span class="readout-suffix">s</span>
					</span>
				</div>
			</div>
		{/if}
	</div>
</ApiSection>
