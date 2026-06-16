<script lang="ts">
	import { Button, Label, NumericInput, Select } from '@viamrobotics/prime-core'
	import { AudioInClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import { apiDocsHref } from '$lib/api-docs-href'
	import ApiSection from '$lib/components/api-section.svelte'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import MutationSection from '$lib/components/mutation-section.svelte'
	import Query from '$lib/components/query.svelte'
	import RefetchController from '$lib/components/refetch-controller.svelte'
	import { createRefetchIntervalStore } from '$lib/components/refetch-interval-store.svelte'
	import { numberValueFromEvent } from '$lib/event-handlers'

	import { createAudioCapturer } from './create-audio-capturer.svelte.ts'
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

	let captureCodec = $state('')
	let captureDuration = $state(3)

	const capture = createAudioCapturer(client)

	const availableCodecs = $derived(
		propertiesQuery.data?.supportedCodecs.length ? propertiesQuery.data.supportedCodecs : ['pcm16']
	)

	const selectedCodec = $derived(captureCodec || availableCodecs[0]!)
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
					method="getAudio"
					href={apiDocsHref('rdk:component:audio_input', 'getAudio')}
					description="Capture audio from the device"
					lastError={capture.error}
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
						{#if capture.status === 'recording'}
							<p class="font-roboto-mono text-subtle-1 text-xs">
								{(capture.totalBytes / 1024).toFixed(1)} kB captured
							</p>
							<Button
								icon="stop-circle-outline"
								onclick={capture.stop}
							>
								Stop
							</Button>
						{:else}
							{#if capture.downloadUrl}
								<p class="font-roboto-mono text-subtle-1 text-xs">
									{(capture.totalBytes / 1024).toFixed(1)} kB captured
								</p>
								<a
									href={capture.downloadUrl}
									download="audio-capture.{selectedCodec}"
									rel="external"
								>
									<Button icon="download">Download</Button>
								</a>
							{/if}
							<Button
								icon="play-circle-outline"
								onclick={() => capture.start(selectedCodec, captureDuration)}
								disabled={!client.current}
							>
								{capture.status === 'done' ? 'Capture Again' : 'Start Capture'}
							</Button>
						{/if}
					</div>
				</MutationSection>
			</div>

			<div class="ml-auto flex w-full max-w-1/2 flex-col divide-y sm:max-w-1/3">
				<ApiSection
					title="GetProperties"
					method="getProperties"
					href={apiDocsHref('rdk:component:audio_input', 'getProperties')}
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
