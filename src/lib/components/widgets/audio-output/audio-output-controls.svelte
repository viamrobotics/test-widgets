<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { FileField } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'
	import { AudioOutClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import { toError } from '$lib/components/media-frame/to-error'
	import { Section, useSectionErrors } from '$lib/components/section'

	import { acceptForCodecs, codecFromFile } from './codec.ts'
	import { createAudioPlayer } from './create-audio-player.svelte.ts'
	import { createHoldToTalk } from './create-hold-to-talk.svelte.ts'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const DEFAULT_CODEC = 'pcm16'
	const DEFAULT_SAMPLE_RATE_HZ = 48_000
	const DEFAULT_CHANNELS = 1
	const PRIMARY_POINTER_BUTTON = 0
	const TALK_KEYS = new Set([' ', 'Enter'])

	const client = createResourceClient(
		AudioOutClient,
		() => partID,
		() => resourceName
	)

	// The properties only set the clip and file formats and do not change while the device runs.
	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: false })

	const filePlayer = createAudioPlayer(client)
	const talk = createHoldToTalk(client)

	// A file that cannot be read reaches the indicator with the players' own errors.
	let readError = $state<Error | null>(null)
	const reader = {
		get error() {
			return readError
		},
	}

	const sectionErrors = useSectionErrors(() => ({
		queries: [propertiesQuery],
		mutations: [...talk.errorSources, filePlayer, reader],
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

	const isTalkBusy = $derived(talk.isHeld || talk.isSending)
	const isFilePlaying = $derived(filePlayer.status === 'playing')
	const isConnected = $derived(client.current !== undefined)

	const canTalk = $derived(isConnected && !isFilePlaying)
	const canPlay = $derived(isConnected && fileCodec !== undefined && !isTalkBusy)

	const startTalking = () => {
		if (!canTalk || isTalkBusy) return
		talk.press(sampleRateHz)
	}

	const onTalkPointerDown = (event: PointerEvent) => {
		if (event.button !== PRIMARY_POINTER_BUTTON) return
		startTalking()
	}

	const onTalkKeyDown = (event: KeyboardEvent) => {
		if (!TALK_KEYS.has(event.key)) return
		// The press is the key going down, so the key's own click and page scroll are dropped.
		event.preventDefault()
		if (event.repeat) return
		startTalking()
	}

	const onWindowKeyUp = (event: KeyboardEvent) => {
		if (TALK_KEYS.has(event.key)) talk.release()
	}

	const playFile = async () => {
		if (file === undefined || fileCodec === undefined || !canPlay || isFilePlaying) return
		readError = null
		let audioData: Uint8Array
		try {
			audioData = new Uint8Array(await file.arrayBuffer())
		} catch (error) {
			readError = toError(error)
			return
		}
		await filePlayer.play(audioData, fileCodec, sampleRateHz, numChannels)
	}
</script>

<!-- The release paths Webgamepad uses. A pointer or key let go outside the button still releases. -->
<svelte:window
	onpointerup={talk.release}
	onpointercancel={talk.release}
	onkeyup={onWindowKeyUp}
	onblur={talk.release}
/>

<svelte:document
	onvisibilitychange={() => {
		if (document.visibilityState === 'hidden') talk.release()
	}}
/>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<!-- The container sits outside the section padding, so a 672 px pane reaches `@2xl`. -->
		<div class="@container min-w-0">
			<Section
				errorReporter={sectionErrors}
				class="min-w-0 flex-col gap-2 p-2"
			>
				<Section.Heading class="justify-between">
					Controls
					{#snippet aside()}
						<Section.Errors errors={sectionErrors.errors} />
					{/snippet}
				</Section.Heading>

				<div class="grid min-w-0 grid-cols-1 gap-2 @2xl:grid-cols-2 @2xl:gap-0">
					<div
						role="group"
						aria-label="Talk"
						class="flex min-w-0 flex-col @2xl:pr-2"
					>
						<button
							type="button"
							class={[
								'button button-compact w-full touch-none select-none',
								talk.isHeld && 'button-dark',
							]}
							aria-pressed={talk.isHeld}
							aria-busy={talk.isSending}
							disabled={!canTalk}
							onpointerdown={onTalkPointerDown}
							onkeydown={onTalkKeyDown}
						>
							{#if talk.isSending}
								<span
									class="progress-dots"
									aria-hidden="true"
								></span>
							{/if}
							Hold to talk
						</button>
					</div>

					<div
						role="group"
						aria-label="Play a file"
						class="border-light flex min-w-0 flex-col gap-2 border-t pt-2 @2xl:border-t-0 @2xl:border-l @2xl:pt-0 @2xl:pl-2"
					>
						<FileField
							label="Audio file"
							{accept}
							state={isFileInvalid ? 'error' : undefined}
							hint={isFileInvalid ? 'Unsupported audio format' : undefined}
							bind:value={() => files, setFiles}
						/>
						<div class="flex">
							<button
								type="button"
								class="button button-compact"
								aria-busy={isFilePlaying}
								disabled={!canPlay}
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
						</div>
					</div>
				</div>
			</Section>
		</div>
	{/snippet}
</ConnectionStatus>
