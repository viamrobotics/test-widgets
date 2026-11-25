<script lang="ts">
	import { AudioOutClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import { untrack } from 'svelte'

	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import { Section, useSectionErrors } from '$lib/components/section'

	import { useAudioOutputState } from './audio-output-state.svelte.ts'
	import { createHoldToTalk } from './create-hold-to-talk.svelte.ts'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const DEFAULT_SAMPLE_RATE_HZ = 48_000
	const PRIMARY_POINTER_BUTTON = 0
	const TALK_KEYS = new Set([' ', 'Enter'])

	const client = createResourceClient(
		AudioOutClient,
		() => partID,
		() => resourceName
	)

	// The properties only set the sample rate and do not change while the device runs.
	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: false })

	const { playback } = untrack(() => useAudioOutputState(partID, resourceName))
	const talk = createHoldToTalk(client, playback)

	const sectionErrors = useSectionErrors(() => ({
		queries: [propertiesQuery],
		mutations: talk.errorSources,
	}))

	// A device reports 0 for a value it does not know, which is no valid rate.
	const sampleRateHz = $derived.by(() => {
		const reported = propertiesQuery.data?.sampleRateHz
		return reported !== undefined && reported > 0 ? reported : DEFAULT_SAMPLE_RATE_HZ
	})

	const isConnected = $derived(client.current !== undefined)
	// Its own press keeps the button enabled while it holds the group, so a release still lands.
	const isBlockedByPlayback = $derived(playback.isBusy && !talk.ownsPlayback)
	const canTalk = $derived(isConnected && !isBlockedByPlayback)

	const startTalking = () => {
		if (!canTalk) return
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
</script>

<!-- A pointer or key let go outside the button still releases. -->
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
		<Section
			errorReporter={sectionErrors}
			class="min-w-0 flex-col gap-2 p-2"
		>
			<Section.Heading class="justify-between">
				Hold to talk
				{#snippet aside()}
					<Section.Errors errors={sectionErrors.errors} />
				{/snippet}
			</Section.Heading>

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
		</Section>
	{/snippet}
</ConnectionStatus>
