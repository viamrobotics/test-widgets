<script lang="ts">
	import { mdiLayersTripleOutline } from '@mdi/js'
	import { Banner, Dialog, Icon } from '@viamrobotics/prime-ui'

	import type { MediaFrameAddToDataset, MediaFrameCapture } from './media-frame-capture'

	import HeldBack from '../HeldBack.svelte'
	import { toError } from './to-error'
	import { useReportedError } from './use-reported-error.svelte'

	interface Props {
		addToDataset: MediaFrameAddToDataset
		/** Why the dialog will not open, such as while the frame shows its splash. */
		blockedReason?: string
	}

	const { addToDataset, blockedReason }: Props = $props()

	const FOCUSABLE_SELECTOR = 'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'

	let isOpen = $state(false)
	let isPending = $state(false)
	let captured = $state.raw<MediaFrameCapture>()
	let captureError = $state<Error | null>(null)
	let confirmError = $state<Error | null>(null)
	let formContainer = $state<HTMLElement>()

	// Each open bumps it, so a capture that settles after its dialog closed is dropped.
	let captureRequest = 0

	useReportedError(() => captureError)

	const previewUrl = $derived.by(() => {
		if (!captured) return undefined
		const image = captured.preview ?? captured
		return URL.createObjectURL(
			new Blob([new Uint8Array(image.binaryData)], { type: image.mimeType })
		)
	})

	$effect(() => {
		const url = previewUrl
		if (!url) return
		return () => URL.revokeObjectURL(url)
	})

	$effect(() => {
		const firstField = formContainer?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
		firstField?.focus()
	})

	const takeCapture = async () => {
		captureRequest += 1
		const request = captureRequest
		captureError = null
		try {
			const result = await addToDataset.capture()
			if (request === captureRequest) captured = result
		} catch (error) {
			if (request === captureRequest) captureError = toError(error)
		}
	}

	const closeDialog = () => {
		captureRequest += 1
		isOpen = false
		captured = undefined
		confirmError = null
	}

	const getOpen = () => isOpen

	const setOpen = (next: boolean) => {
		// Cancel, Escape, and the backdrop do nothing while the host is still adding the frame.
		if (isPending) return
		if (!next) {
			closeDialog()
			return
		}
		// The trigger stays focusable while held back, so a press then is dropped here.
		if (blockedReason !== undefined) return
		isOpen = true
		void takeCapture()
	}

	const confirm = async () => {
		if (!captured || isPending) return
		isPending = true
		confirmError = null
		try {
			await addToDataset.onConfirm(captured)
		} catch (error) {
			confirmError = toError(error)
			return
		} finally {
			isPending = false
		}
		closeDialog()
	}

	// One live region reads the capture and the confirm, since the visible text is not live.
	const dialogStatus = $derived.by(() => {
		if (isPending) return 'Adding to dataset'
		if (!isOpen) return ''
		if (captureError) return 'Capture failed'
		return captured ? 'Capture ready' : 'Capturing frame'
	})

	const CAPTURE_FAILED = 'The frame could not be captured.'
	const captureFailedId = $props.id()

	const cancelReason = $derived(isPending ? 'Wait for the frame to finish adding.' : undefined)

	// Add's own call in flight shows its busy cue, never a held-back reason.
	const addReason = $derived.by(() => {
		if (isPending || captured) return undefined
		if (captureError) return CAPTURE_FAILED
		return 'Wait for the frame capture to finish.'
	})
	// The preview box already shows the capture failure, so Add's description points at it.
	const addReasonId = $derived(captureError ? captureFailedId : undefined)
</script>

<Dialog bind:open={getOpen, setOpen}>
	<HeldBack reason={blockedReason}>
		{#snippet children(heldBack)}
			<Dialog.Trigger
				class="button button-xs"
				{...heldBack}
			>
				<Icon
					icon={mdiLayersTripleOutline}
					size="sm"
				/>
				Add to dataset
			</Dialog.Trigger>
		{/snippet}
	</HeldBack>
	<Dialog.Content class="flex w-[calc(100%-2rem)] max-w-md flex-col gap-3 overflow-y-auto">
		<Dialog.Title class="text-heading text-base font-semibold">Add to dataset</Dialog.Title>

		<div class="bg-medium flex aspect-video w-full items-center justify-center overflow-hidden">
			{#if previewUrl}
				<img
					src={previewUrl}
					alt="Preview of the capture from {addToDataset.resourceName}"
					class="size-full object-contain"
				/>
			{:else if captureError}
				<p
					id={captureFailedId}
					class="text-subtle-1 px-4 text-center text-xs"
				>
					{CAPTURE_FAILED}
				</p>
			{:else}
				<p class="text-subtle-1 text-xs">Capturing frame</p>
			{/if}
		</div>

		<Dialog.Description class="font-roboto-mono text-subtle-1 text-xs wrap-break-word">
			{addToDataset.resourceName} · {addToDataset.methodName}
			{#if captured}
				· {captured.mimeType}
			{/if}
		</Dialog.Description>

		{#if addToDataset.form && captured}
			<fieldset
				bind:this={formContainer}
				class="min-w-0"
				disabled={isPending}
			>
				{@render addToDataset.form({
					binaryData: captured.binaryData,
					mimeType: captured.mimeType,
					resourceName: addToDataset.resourceName,
					methodName: addToDataset.methodName,
				})}
			</fieldset>
		{/if}

		{#if confirmError}
			<Banner variant="danger">
				<Banner.Title>Could not add to dataset</Banner.Title>
				<Banner.Description>{confirmError.message}</Banner.Description>
			</Banner>
		{/if}

		<div class="flex justify-end gap-2">
			<HeldBack reason={cancelReason}>
				{#snippet children(heldBack)}
					<Dialog.Close
						class="button"
						aria-label="Cancel"
						{...heldBack}
					>
						Cancel
					</Dialog.Close>
				{/snippet}
			</HeldBack>
			<HeldBack
				reason={addReason}
				reasonId={addReasonId}
			>
				{#snippet children(heldBack)}
					<button
						type="button"
						class="button button-dark"
						aria-busy={isPending}
						{...heldBack}
						onclick={confirm}
					>
						{#if isPending}
							<span
								class="progress-dots"
								aria-hidden="true"
							></span>
							Adding
						{:else}
							Add
						{/if}
					</button>
				{/snippet}
			</HeldBack>
			<span
				class="sr-only"
				role="status"
			>
				{dialogStatus}
			</span>
		</div>
	</Dialog.Content>
</Dialog>
