<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { FileField } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'
	import { AudioOutClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ConnectionStatus from '#lib/components/ConnectionStatus.svelte'
	import HeldBack from '#lib/components/HeldBack.svelte'
	import { toError } from '#lib/components/MediaFrame/to-error.js'
	import { Section, useSectionErrors } from '#lib/components/Section/index.js'
	import StatusLine from '#lib/components/StatusLine.svelte'
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

	const client = createResourceClient(
		AudioOutClient,
		() => partID,
		() => resourceName
	)

	// The properties only set the clip and file formats and do not change while the device runs.
	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: false })

	const filePlayer = createAudioPlayer(client)
	const { playback } = untrack(() => useAudioOutputState(partID, resourceName))

	// A file that cannot be read reaches the indicator with the player's own errors.
	let readError = $state<Error | null>(null)
	const reader = {
		get error() {
			return readError
		},
	}

	const sectionErrors = useSectionErrors(() => ({
		queries: [propertiesQuery],
		mutations: [filePlayer, reader],
	}))

	// A device reports 0 for a value it does not know, which is no valid rate or count.
	const positiveOr = (value: number | undefined, fallback: number) =>
		value !== undefined && value > 0 ? value : fallback

	const sampleRateHz = $derived(
		positiveOr(propertiesQuery.data?.sampleRateHz, DEFAULT_SAMPLE_RATE_HZ)
	)
	const numChannels = $derived(positiveOr(propertiesQuery.data?.numChannels, DEFAULT_CHANNELS))

	const offeredCodecs = $derived.by(() => {
		const supported = propertiesQuery.data?.supportedCodecs ?? []
		return supported.length > 0 ? supported : [DEFAULT_CODEC]
	})
	const accept = $derived(acceptForCodecs(offeredCodecs))

	let files = $state.raw<File[]>([])
	const file = $derived(files[0])
	const fileCodec = $derived(file === undefined ? undefined : codecFromFile(file))
	const isFileInvalid = $derived(file !== undefined && fileCodec === undefined)

	const setFiles = (next: File[] | undefined) => {
		files = next ?? []
	}

	const isFilePlaying = $derived(filePlayer.status === 'playing')
	const blockedReason = $derived.by(() => {
		if (client.current === undefined) return 'The audio output is not connected.'
		if (playback.isBusy) return 'Wait for the audio in flight to finish.'
		if (file === undefined) return 'Choose an audio file first.'
		return fileCodec === undefined ? 'Choose a file in a supported audio format.' : undefined
	})

	const statusText = $derived.by(() => {
		if (isFilePlaying) return 'Playing.'
		return filePlayer.status === 'error' || readError !== null ? 'Play failed' : ''
	})

	// The button stays focusable while held back, so a press then is dropped here.
	const playFile = async () => {
		if (file === undefined || fileCodec === undefined || blockedReason !== undefined) return
		readError = null
		let audioData: Uint8Array
		try {
			audioData = new Uint8Array(await file.arrayBuffer())
		} catch (error) {
			readError = toError(error)
			return
		}
		const codec = fileCodec
		const sampleRate = sampleRateHz
		const channels = numChannels
		await playback.run(() => filePlayer.play(audioData, codec, sampleRate, channels))
	}
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<Section
			errorReporter={sectionErrors}
			class="min-w-0 flex-col gap-2 p-2"
		>
			<Section.Heading class="justify-between">
				Play a file
				{#snippet aside()}
					<Section.Errors errors={sectionErrors.errors} />
				{/snippet}
			</Section.Heading>

			<div class="flex min-w-0 flex-col gap-2">
				<FileField
					label="Audio file"
					{accept}
					state={isFileInvalid ? 'error' : undefined}
					hint={isFileInvalid ? 'Unsupported audio format' : undefined}
					bind:value={() => files, setFiles}
				/>
				<div class="flex">
					<HeldBack reason={blockedReason}>
						{#snippet children(heldBack)}
							<button
								type="button"
								class="button button-compact"
								{...heldBack}
								onclick={playFile}
							>
								{#if isFilePlaying}
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
		</Section>
	{/snippet}
</ConnectionStatus>
