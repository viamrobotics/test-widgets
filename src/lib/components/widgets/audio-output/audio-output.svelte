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

	import { ExtToCodec, MimeToCodec } from './codec.ts'
	import { createAudioPlayer } from './create-audio-player.svelte.ts'
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

	const playContext = createAudioPlayer(client)

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

	const handleFileChange = (event: Event) => {
		const input = event.target as HTMLInputElement
		const file = input.files?.[0] ?? null
		selectedFile = file
		fileInputError = null
		if (file) {
			const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
			if (MimeToCodec[file.type]) {
				playCodec = MimeToCodec[file.type]
			} else if (MimeToCodec[`audio/${ext}`]) {
				playCodec = MimeToCodec[`audio/${ext}`]
			} else if (ExtToCodec[ext]) {
				playCodec = ExtToCodec[ext]
			} else {
				fileInputError = 'Unsupported audio format'
			}
		}
	}

	const play = async () => {
		if (!selectedFile) {
			fileInputError = 'Please select an audio file'
			return
		}
		if (!client.current) return

		const buffer = await selectedFile.arrayBuffer()
		const audioData = new Uint8Array(buffer)
		await playContext.play(audioData, selectedCodec, selectedSampleRateHz, selectedNumChannels)
	}

	const playButtonLabel = $derived.by(() => {
		if (playContext.status === 'playing') return 'Playing...'
		if (playContext.status === 'done') return 'Play Again'
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
					api="rdk:component:audio_output"
					description="Send audio data to the device"
					lastError={playContext.error}
				>
					<div class="flex flex-col gap-2">
						<Label cx="gap-1 text-xs">
							Audio file
							<input
								slot="input"
								type="file"
								accept={availableCodecs.map((c) => `.${c}`).join(',')}
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
							disabled={!client.current || playContext.status === 'playing'}
						>
							{playButtonLabel}
						</Button>
					</div>
				</MutationSection>
			</div>

			<div class="ml-auto flex w-full max-w-1/2 flex-col divide-y sm:max-w-1/3">
				<ApiSection
					title="GetProperties"
					api="rdk:component:audio_output"
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
