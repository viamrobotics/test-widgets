<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { FileField, NumberField, Select } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'
	import { AudioOutClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { emptyOnClear } from '#lib/components/empty-on-clear.js'
	import HeldBack from '#lib/components/HeldBack.svelte'
	import StatusLine from '#lib/components/StatusLine.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'
	import { untrack } from 'svelte'

	import { useAudioOutputState } from './audio-output-state.svelte.ts'
	import { acceptForCodecs, codecFromFile } from './codec.ts'
	import { createAudioPlayer } from './create-audio-player.svelte.ts'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const DEFAULT_CODEC = 'pcm16'
	const DEFAULT_SAMPLE_RATE_HZ = 48_000
	const DEFAULT_CHANNELS = 1
	const COUNT_HINT = 'Enter a whole number of at least 1.'

	const client = createResourceClient(
		AudioOutClient,
		() => partID,
		() => resourceName
	)

	// The properties only seed the defaults and do not change while the device runs.
	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: false })

	const player = createAudioPlayer(client)
	const { playback } = untrack(() => useAudioOutputState(partID, resourceName))

	// A file that cannot be read reaches the indicator with the player's own errors.
	let readError = $state<Error | null>(null)
	const reader = {
		get error() {
			return readError
		},
	}

	let files = $state.raw<File[]>([])
	let pickedCodec = $state('')
	// `null` is untouched, so the field shows the default. `undefined` is a cleared field.
	let sampleRateHz = $state<number | null | undefined>(null)
	let numChannels = $state<number | null | undefined>(null)

	const file = $derived(files[0])
	const fileCodec = $derived(file === undefined ? undefined : codecFromFile(file))
	const isFileInvalid = $derived(file !== undefined && fileCodec === undefined)

	const offeredCodecs = $derived.by(() => {
		const supported = propertiesQuery.data?.supportedCodecs ?? []
		return supported.length > 0 ? supported : [DEFAULT_CODEC]
	})
	const selectedCodec = $derived(pickedCodec === '' ? offeredCodecs[0]! : pickedCodec)
	const codecItems = $derived.by(() => {
		const codecs = offeredCodecs.includes(selectedCodec)
			? offeredCodecs
			: [...offeredCodecs, selectedCodec]
		return codecs.map((codec) => ({ value: codec, label: codec }))
	})
	const accept = $derived(acceptForCodecs(offeredCodecs))

	// A device reports 0 for a value it does not know, which is no valid rate or count.
	const positiveOr = (value: number | undefined, fallback: number) =>
		value !== undefined && value > 0 ? value : fallback

	const selectedSampleRateHz = $derived(
		sampleRateHz === null
			? positiveOr(propertiesQuery.data?.sampleRateHz, DEFAULT_SAMPLE_RATE_HZ)
			: sampleRateHz
	)
	const selectedNumChannels = $derived(
		numChannels === null
			? positiveOr(propertiesQuery.data?.numChannels, DEFAULT_CHANNELS)
			: numChannels
	)

	const isCount = (value: number | undefined): value is number =>
		value !== undefined && Number.isInteger(value) && value >= 1
	const isSampleRateValid = $derived(isCount(selectedSampleRateHz))
	const isNumChannelsValid = $derived(isCount(selectedNumChannels))

	// Picking a file sets the codec it holds, which stays editable afterwards.
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

	const labelId = $props.id()

	const isPlaying = $derived(player.status === 'playing')
	const blockedReason = $derived.by(() => {
		if (client.current === undefined) return 'The audio output is not connected.'
		if (playback.isBusy) return 'Wait for the audio in flight to finish.'
		if (file === undefined) return 'Choose an audio file first.'
		if (isFileInvalid) return 'Choose a file in a supported audio format.'
		if (!isSampleRateValid) return 'Enter the sample rate as a whole number of at least 1.'
		return isNumChannelsValid ? undefined : 'Enter the channels as a whole number of at least 1.'
	})

	const statusText = $derived.by(() => {
		if (isPlaying) return 'Playing.'
		return player.status === 'error' || readError !== null ? 'Play failed' : ''
	})

	// The button stays focusable while held back, so a press then is dropped here.
	const play = async () => {
		if (file === undefined || blockedReason !== undefined) return
		if (!isCount(selectedSampleRateHz) || !isCount(selectedNumChannels)) return
		readError = null
		let audioData: Uint8Array
		try {
			audioData = new Uint8Array(await file.arrayBuffer())
		} catch (error) {
			readError = error instanceof Error ? error : new Error(String(error))
			return
		}
		const codec = selectedCodec
		const sampleRate = selectedSampleRateHz
		const channels = selectedNumChannels
		await playback.run(() => player.play(audioData, codec, sampleRate, channels))
	}
</script>

<ApiSection
	method="Play"
	api={ResourceTriplets.AudioOutput}
	queries={[propertiesQuery]}
	mutations={[player, reader]}
	class="grow flex-col gap-2"
>
	<div class="flex w-full flex-col gap-2">
		<FileField
			label="Audio file"
			{accept}
			state={isFileInvalid ? 'error' : undefined}
			hint={isFileInvalid ? 'Unsupported audio format' : undefined}
			bind:value={() => files, setFiles}
		/>
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
				/>
			</div>
		</div>
		<NumberField
			label="Sample rate"
			suffix="Hz"
			min={1}
			state={isSampleRateValid ? undefined : 'error'}
			hint={isSampleRateValid ? undefined : COUNT_HINT}
			{...emptyOnClear(() => setSampleRate(undefined))}
			bind:value={() => selectedSampleRateHz, setSampleRate}
		/>
		<NumberField
			label="Channels"
			min={1}
			state={isNumChannelsValid ? undefined : 'error'}
			hint={isNumChannelsValid ? undefined : COUNT_HINT}
			{...emptyOnClear(() => setNumChannels(undefined))}
			bind:value={() => selectedNumChannels, setNumChannels}
		/>
		<div class="flex">
			<HeldBack reason={blockedReason}>
				{#snippet children(heldBack)}
					<button
						type="button"
						class="button button-compact"
						{...heldBack}
						onclick={play}
					>
						{#if isPlaying}
							<span
								class="progress-dots"
								aria-hidden="true"
							></span>
						{:else}
							<Icon
								icon={mdiPlayCircleOutline}
								size="sm"
							/>
						{/if}
						Play
					</button>
				{/snippet}
			</HeldBack>
		</div>
		<StatusLine text={statusText} />
	</div>
</ApiSection>
