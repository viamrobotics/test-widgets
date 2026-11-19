<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { FileField, NumberField, Select } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'
	import { AudioOutClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

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

	const client = createResourceClient(
		AudioOutClient,
		() => partID,
		() => resourceName
	)

	// The properties only seed the defaults and do not change while the device runs.
	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: false })

	const player = createAudioPlayer(client)

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
	const canPlay = $derived(
		client.current !== undefined &&
			file !== undefined &&
			!isFileInvalid &&
			isSampleRateValid &&
			isNumChannelsValid &&
			!isPlaying
	)

	const play = async () => {
		if (file === undefined || !canPlay) return
		if (!isCount(selectedSampleRateHz) || !isCount(selectedNumChannels)) return
		readError = null
		let audioData: Uint8Array
		try {
			audioData = new Uint8Array(await file.arrayBuffer())
		} catch (error) {
			readError = error instanceof Error ? error : new Error(String(error))
			return
		}
		await player.play(audioData, selectedCodec, selectedSampleRateHz, selectedNumChannels)
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
				class="text-subtle-1 w-28 shrink-0 text-xs"
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
			bind:value={() => selectedSampleRateHz, setSampleRate}
		/>
		<NumberField
			label="Channels"
			min={1}
			state={isNumChannelsValid ? undefined : 'error'}
			bind:value={() => selectedNumChannels, setNumChannels}
		/>
		<div class="flex">
			<button
				type="button"
				class="button button-compact"
				disabled={!canPlay}
				aria-busy={isPlaying}
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
		</div>
	</div>
</ApiSection>
