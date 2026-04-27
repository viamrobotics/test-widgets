<script lang="ts">
	import { Button, Label, NumericInput, Select } from '@viamrobotics/prime-core'
	import { AudioInClient } from '@viamrobotics/sdk'
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
		'audio-input'
	)

	const client = createResourceClient(
		AudioInClient,
		() => partID,
		() => resourceName
	)

	const propertiesQuery = createResourceQuery(client, 'getProperties', () => ({
		refetchInterval: refetchInterval.current,
	}))

	type CaptureStatus = 'idle' | 'recording' | 'done' | 'error'
	let captureStatus = $state<CaptureStatus>('idle')
	let captureError = $state<Error | null>(null)
	let captureCodec = $state('')
	let captureDuration = $state(3)
	let captureTotalBytes = $state(0)
	let captureDownloadUrl = $state<string>()
	let captureAbortController = $state.raw<AbortController>()

	const availableCodecs = $derived(
		propertiesQuery.data?.supportedCodecs.length ? propertiesQuery.data.supportedCodecs : ['pcm16']
	)

	const selectedCodec = $derived(captureCodec || availableCodecs[0]!)

	const startCapture = async () => {
		if (!client.current) return

		captureStatus = 'recording'
		captureError = null
		captureTotalBytes = 0

		if (captureDownloadUrl) {
			URL.revokeObjectURL(captureDownloadUrl)
			captureDownloadUrl = undefined
		}

		const controller = new AbortController()
		captureAbortController = controller

		const chunks: Uint8Array[] = []

		try {
			const stream = client.current.getAudio(
				selectedCodec,
				captureDuration,
				0n,
				{},
				{ ...client.current.callOptions, signal: controller.signal }
			)

			for await (const chunk of stream) {
				chunks.push(chunk.audioData)
				captureTotalBytes += chunk.audioData.byteLength
			}

			captureStatus = 'done'
		} catch (error) {
			if (controller.signal.aborted) {
				captureStatus = 'done'
			} else {
				captureStatus = 'error'
				captureError = error instanceof Error ? error : new Error(String(error))
			}
		} finally {
			captureAbortController = undefined
		}

		if (chunks.length > 0) {
			const totalLength = chunks.reduce((sum, c) => sum + c.byteLength, 0)
			const merged = new Uint8Array(totalLength)
			let offset = 0
			for (const chunk of chunks) {
				merged.set(chunk, offset)
				offset += chunk.byteLength
			}

			const mimeTypes: Record<string, string> = {
				mp3: 'audio/mpeg',
				wav: 'audio/wav',
				aac: 'audio/aac',
				opus: 'audio/ogg',
				flac: 'audio/flac',
			}
			const mimeType = mimeTypes[selectedCodec] ?? 'audio/octet-stream'
			captureDownloadUrl = URL.createObjectURL(new Blob([merged], { type: mimeType }))
		}
	}

	const stopCapture = () => {
		captureAbortController?.abort()
	}
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
					title="GetAudio"
					description="Capture audio from the device"
					lastError={captureError}
				>
					<div class="flex flex-col gap-2">
						<Label cx="gap-1 text-xs">
							Codec
							<Select
								slot="input"
								value={selectedCodec}
								on:change={(e) => {
									captureCodec = (e.target as HTMLSelectElement).value
								}}
							>
								{#each availableCodecs as codec (codec)}
									<option value={codec}>{codec}</option>
								{/each}
							</Select>
						</Label>
						<Label cx="gap-1 text-xs">
							Duration (seconds, 0 = stream until stopped)
							<NumericInput
								slot="input"
								value={captureDuration}
								on:change={(e) => {
									captureDuration = numberValueFromEvent(e) ?? 3
								}}
							/>
						</Label>
					</div>

					<div class="mt-auto flex flex-col items-start gap-2">
						{#if captureStatus === 'recording'}
							<p class="font-roboto-mono text-subtle-1 text-xs">
								{(captureTotalBytes / 1024).toFixed(1)} kB captured
							</p>
							<Button
								icon="stop-circle-outline"
								onclick={stopCapture}
							>
								Stop
							</Button>
						{:else}
							{#if captureDownloadUrl}
								<p class="font-roboto-mono text-subtle-1 text-xs">
									{(captureTotalBytes / 1024).toFixed(1)} kB captured
								</p>
								<a
									href={captureDownloadUrl}
									download="audio-capture.{selectedCodec}"
									rel="external"
								>
									<Button icon="download">Download</Button>
								</a>
							{/if}
							<Button
								icon="play-circle-outline"
								onclick={startCapture}
								disabled={!client.current}
							>
								{captureStatus === 'done' ? 'Capture Again' : 'Start Capture'}
							</Button>
						{/if}
					</div>
				</MutationSection>
			</div>

			<div class="ml-auto flex w-full max-w-1/2 flex-col divide-y sm:max-w-1/3">
				<ApiSection
					title="GetProperties"
					description="Audio input properties"
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
