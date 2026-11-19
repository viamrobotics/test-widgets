<script lang="ts">
	import { mdiBroadcast, mdiDownload, mdiRadioboxMarked } from '@mdi/js'
	import { Select } from '@viamrobotics/prime-controls'
	import { Icon, Progress } from '@viamrobotics/prime-ui'
	import { AudioInClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import { Section, useSectionErrors } from '$lib/components/section'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import { createAudioListener } from './create-audio-listener.svelte'
	import { PLAYABLE_CODECS } from './pcm-decode'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const DEFAULT_CODEC = 'pcm16'
	const BYTES_PER_KB = 1024
	const PERCENT = 100

	const client = createResourceClient(
		AudioInClient,
		() => partID,
		() => resourceName
	)

	// The codecs and channel count do not change while the device runs, so they are read once.
	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: false })

	const listener = createAudioListener(client)

	const sectionErrors = useSectionErrors(() => ({
		queries: [propertiesQuery],
		mutations: [listener],
	}))

	const codecs = $derived.by(() => {
		const supported = propertiesQuery.data?.supportedCodecs ?? []
		return supported.length > 0 ? supported : [DEFAULT_CODEC]
	})
	const playableCodecs = $derived([
		...codecs.filter((codec) => codec === DEFAULT_CODEC),
		...codecs.filter((codec) => codec !== DEFAULT_CODEC && PLAYABLE_CODECS.has(codec)),
	])
	const unplayableCodecs = $derived(codecs.filter((codec) => !PLAYABLE_CODECS.has(codec)))
	const codecItems = $derived([
		...playableCodecs.map((codec) => ({ value: codec, label: codec })),
		...unplayableCodecs.map((codec) => ({ value: codec, label: codec, disabled: true })),
	])

	let pickedCodec = $state('')
	const selectedCodec = $derived(
		playableCodecs.includes(pickedCodec) ? pickedCodec : playableCodecs[0]
	)

	const setCodec = (next: string | undefined) => {
		if (next !== undefined) pickedCodec = next
	}

	const canListen = $derived(client.current !== undefined && selectedCodec !== undefined)

	const toggleListen = () => {
		if (listener.isListening) {
			listener.stop()
			return
		}
		if (selectedCodec === undefined) return
		void listener.listen(selectedCodec)
	}

	const toggleRecord = () => {
		if (listener.isRecording) {
			listener.stopRecording()
			return
		}
		listener.startRecording()
	}

	const saveRecording = () => {
		const recording = listener.download
		if (recording === undefined) return
		const link = document.createElement('a')
		link.href = recording.url
		link.download = recording.fileName
		link.click()
	}

	const channelCount = $derived(propertiesQuery.data?.numChannels ?? 0)
	const meterLevels = $derived(
		listener.levels.length > 0 ? listener.levels : Array.from({ length: channelCount }, () => 0)
	)

	const hasRecording = $derived(listener.isRecording || listener.download !== undefined)
	const recordedText = $derived((listener.recordedBytes / BYTES_PER_KB).toFixed(1))
	const elapsedText = $derived(listener.elapsedSeconds.toFixed(1))

	const id = $props.id()
	const codecLabelId = `${id}-codec`
	const levelLabelId = `${id}-level`
	const recordingLabelId = `${id}-recording`
</script>

{#snippet readout(label: string, text: string, suffix: string)}
	<div class="flex min-w-0 items-center gap-2">
		<span class="text-subtle-1 w-24 shrink-0 truncate text-xs">{label}</span>
		<span class="readout font-roboto-mono">
			<span class="readout-value">{text}</span>
			<span class="readout-suffix">{suffix}</span>
		</span>
	</div>
{/snippet}

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="@container">
			<Section
				errorReporter={sectionErrors}
				class="min-w-0 flex-col gap-2 px-2 py-2"
			>
				<Section.Heading>
					<Section.Method
						method="GetAudio"
						api={ResourceTriplets.AudioInput}
					/>
					{#snippet aside()}
						<Section.Errors errors={sectionErrors.errors} />
					{/snippet}
				</Section.Heading>

				<div class="grid grid-cols-1 gap-2 @2xl:grid-cols-2 @2xl:gap-x-4">
					<div class="flex min-w-0 flex-col gap-2 @2xl:col-start-1">
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
									disabled={listener.isListening}
								>
									<Select.Trigger aria-labelledby={codecLabelId}>
										<Select.Value />
									</Select.Trigger>
									<Select.Content>
										<Select.Viewport>
											<Select.Group>
												<Select.GroupHeading>Plays in this browser</Select.GroupHeading>
												{#each playableCodecs as codec (codec)}
													<Select.Item
														value={codec}
														label={codec}
													/>
												{/each}
											</Select.Group>
											{#if unplayableCodecs.length > 0}
												<Select.Group>
													<Select.GroupHeading>Cannot play here</Select.GroupHeading>
													{#each unplayableCodecs as codec (codec)}
														<Select.Item
															value={codec}
															label={codec}
															disabled
														/>
													{/each}
												</Select.Group>
											{/if}
										</Select.Viewport>
									</Select.Content>
								</Select>
							</div>
						</div>

						<div class="flex flex-wrap items-center gap-2">
							<button
								type="button"
								class={['button button-xs', listener.isListening && 'button-dark']}
								aria-pressed={listener.isListening}
								disabled={!canListen}
								onclick={toggleListen}
							>
								<Icon icon={mdiBroadcast} />
								Listen
							</button>
							<button
								type="button"
								class={['button button-xs', listener.isRecording && 'button-dark']}
								aria-pressed={listener.isRecording}
								disabled={!listener.isListening}
								onclick={toggleRecord}
							>
								<Icon icon={mdiRadioboxMarked} />
								Record
							</button>
							<button
								type="button"
								class="button button-xs"
								disabled={listener.download === undefined}
								onclick={saveRecording}
							>
								<Icon icon={mdiDownload} />
								Download
							</button>
						</div>
					</div>

					{#if meterLevels.length > 0}
						<div
							role="group"
							aria-labelledby={levelLabelId}
							class="flex min-w-0 flex-col gap-1 @2xl:col-start-2 @2xl:row-span-2 @2xl:row-start-1"
						>
							<span
								id={levelLabelId}
								class="text-xs font-semibold"
							>
								Level
							</span>
							{#each meterLevels as level, index (index)}
								{@const channelLabel = `Channel ${(index + 1).toString()}`}
								<div class="flex min-w-0 items-center gap-2">
									<span class="text-subtle-1 w-18 shrink-0 truncate text-xs">{channelLabel}</span>
									<Progress
										value={level * PERCENT}
										label="{channelLabel} level"
										class="min-w-0 flex-1"
									/>
								</div>
							{/each}
						</div>
					{/if}

					{#if hasRecording}
						<div
							role="group"
							aria-labelledby={recordingLabelId}
							class="flex min-w-0 flex-col gap-1 @2xl:col-start-1"
						>
							<span
								id={recordingLabelId}
								class="text-xs font-semibold"
							>
								Recording
							</span>
							{@render readout('Recorded', recordedText, 'KB')}
							{@render readout('Elapsed', elapsedText, 's')}
						</div>
					{/if}
				</div>
			</Section>
		</div>
	{/snippet}
</ConnectionStatus>
