<script lang="ts">
	import { Button, Label, NumericInput, Select } from '@viamrobotics/prime-core'
	import { AudioOutClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import MutationSection from '$lib/components/mutation-section.svelte'
	import Query from '$lib/components/query.svelte'
	import RefetchController from '$lib/components/refetch-controller.svelte'
	import { createRefetchIntervalStore } from '$lib/components/refetch-interval-store.svelte'
	import { numberValueFromEvent } from '$lib/event-handlers'

	import Properties from './properties.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const refetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'audio-output'
	)

	const client = createResourceClient(
		AudioOutClient,
		() => partID,
		() => resourceName
	)

	const propertiesQuery = createResourceQuery(client, 'getProperties', () => ({
		refetchInterval: refetchInterval.current,
	}))

	const availableCodecs = $derived(
		propertiesQuery.data?.supportedCodecs.length ? propertiesQuery.data.supportedCodecs : ['pcm16']
	)

	type PlayStatus = 'idle' | 'playing' | 'done' | 'error'
	let playStatus = $state<PlayStatus>('idle')
	let playError = $state<Error | null>(null)

	let selectedFile = $state.raw<File | null>(null)
	let fileInputError = $state<string | null>(null)
	let playCodec = $state('')
	let playSampleRateHz = $state<number | null>(null)
	let playNumChannels = $state<number | null>(null)

	const selectedCodec = $derived(playCodec || availableCodecs[0]!)
	const selectedSampleRateHz = $derived(
		playSampleRateHz ?? propertiesQuery.data?.sampleRateHz ?? 48000
	)
	const selectedNumChannels = $derived(playNumChannels ?? propertiesQuery.data?.numChannels ?? 1)

	const mimeToCodec: Record<string, string> = {
		'audio/mpeg': 'mp3',
		'audio/mp3': 'mp3',
		'audio/wav': 'wav',
		'audio/x-wav': 'wav',
		'audio/aac': 'aac',
		'audio/ogg': 'opus',
		'audio/flac': 'flac',
		'audio/x-flac': 'flac',
	}

	const handleFileChange = (event: Event) => {
		const input = event.target as HTMLInputElement
		const file = input.files?.[0] ?? null
		selectedFile = file
		fileInputError = null
		if (file) {
			const detected = mimeToCodec[file.type] ?? file.name.split('.').pop()?.toLowerCase() ?? ''
			playCodec = detected
		}
	}

	const play = async () => {
		if (!selectedFile) {
			fileInputError = 'Please select an audio file'
			return
		}
		if (!client.current) return

		playStatus = 'playing'
		playError = null

		try {
			const buffer = await selectedFile.arrayBuffer()
			const audioData = new Uint8Array(buffer)

			// AudioInfo is not exported from the SDK barrel; cast is safe because
			// PlayRequest's constructor accepts PartialMessage<AudioInfo> at runtime.
			await client.current.play(
				audioData,
				{
					codec: selectedCodec,
					sampleRateHz: selectedSampleRateHz,
					numChannels: selectedNumChannels,
				} as unknown as Parameters<AudioOutClient['play']>[1],
				{}
			)
			playStatus = 'done'
		} catch (error) {
			playStatus = 'error'
			playError = error instanceof Error ? error : new Error(String(error))
		}
	}

	const playButtonLabel = $derived.by(() => {
		if (playStatus === 'playing') return 'Playing...'
		if (playStatus === 'done') return 'Play Again'
		return 'Play'
	})
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="p-4 pb-3">
			<RefetchController
				{refetchInterval}
				queries={[propertiesQuery]}
			/>
		</div>

		<div class="flex flex-row divide-x">
			<div class="flex w-full flex-col divide-y">
				<MutationSection
					title="Play"
					description="Send audio data to the device"
					lastError={playError}
				>
					<div class="flex flex-col gap-2">
						<Label cx="gap-1 text-xs">
							Audio file
							<input
								slot="input"
								type="file"
								accept="audio/*"
								class="text-xs"
								onchange={handleFileChange}
							/>
						</Label>
						{#if fileInputError}
							<p class="text-xs text-red-500">{fileInputError}</p>
						{/if}
						{#if selectedFile}
							<p class="font-roboto-mono text-subtle-1 text-xs">{selectedFile.name}</p>
						{/if}
						<Label cx="gap-1 text-xs">
							Codec
							<Select
								slot="input"
								value={selectedCodec}
								on:change={(e) => {
									playCodec = (e.target as HTMLSelectElement).value
								}}
							>
								{#each availableCodecs as codec (codec)}
									<option value={codec}>{codec}</option>
								{/each}
							</Select>
						</Label>
						<Label cx="gap-1 text-xs">
							Sample rate (Hz)
							<NumericInput
								slot="input"
								value={selectedSampleRateHz}
								on:change={(e) => {
									playSampleRateHz = numberValueFromEvent(e) ?? null
								}}
							/>
						</Label>
						<Label cx="gap-1 text-xs">
							Channels
							<NumericInput
								slot="input"
								value={selectedNumChannels}
								on:change={(e) => {
									playNumChannels = numberValueFromEvent(e) ?? null
								}}
							/>
						</Label>
					</div>

					<div class="mt-auto">
						<Button
							icon="play-circle-outline"
							onclick={play}
							disabled={!client.current || playStatus === 'playing'}
						>
							{playButtonLabel}
						</Button>
					</div>
				</MutationSection>
			</div>

			<div class="ml-auto flex w-full max-w-1/2 flex-col divide-y sm:max-w-1/3">
				<ApiSection
					title="GetProperties"
					description="Audio output properties"
					class="relative"
				>
					<Query
						query={propertiesQuery}
						contentCx="h-6"
					>
						{#if propertiesQuery.data !== undefined}
							<Properties
								supportedCodecs={propertiesQuery.data.supportedCodecs}
								sampleRateHz={propertiesQuery.data.sampleRateHz}
								numChannels={propertiesQuery.data.numChannels}
							/>
						{/if}
					</Query>
				</ApiSection>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>
