<script lang="ts">
	import { mdiLayersTripleOutline } from '@mdi/js'
	import { Banner, Dialog, Icon } from '@viamrobotics/prime-ui'

	import type { MediaFrameAddToDataset, MediaFrameCapture } from './media-frame-capture'

	import { toError } from './to-error'
	import { useReportedError } from './use-reported-error.svelte'

	interface Props {
		addToDataset: MediaFrameAddToDataset
		/** Disables the Add to dataset button, such as while the frame shows its splash. */
		disabled?: boolean
	}

	const { addToDataset, disabled = false }: Props = $props()

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
		return URL.createObjectURL(
			new Blob([new Uint8Array(captured.binaryData)], { type: captured.mimeType })
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

	const confirmStatus = $derived(isPending ? 'Adding to dataset' : '')
</script>

<Dialog bind:open={getOpen, setOpen}>
	<Dialog.Trigger
		class="button button-xs"
		{disabled}
	>
		<Icon
			icon={mdiLayersTripleOutline}
			size="sm"
		/>
		Add to dataset
	</Dialog.Trigger>
	<Dialog.Content class="flex w-[calc(100%-2rem)] max-w-md flex-col gap-3 overflow-y-auto">
		<Dialog.Title class="text-heading text-base font-semibold">Add to dataset</Dialog.Title>

		<div class="bg-medium flex aspect-video w-full items-center justify-center overflow-hidden">
			{#if previewUrl}
				<img
					src={previewUrl}
					alt="Captured frame from {addToDataset.resourceName}"
					class="size-full object-contain"
				/>
			{:else if captureError}
				<p class="text-subtle-1 px-4 text-center text-xs">The frame could not be captured.</p>
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
			<Dialog.Close
				class="button"
				aria-label="Cancel"
				disabled={isPending}
			>
				Cancel
			</Dialog.Close>
			<button
				type="button"
				class="button button-dark"
				disabled={!captured}
				aria-busy={isPending}
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
			<span
				class="sr-only"
				role="status"
			>
				{confirmStatus}
			</span>
		</div>
	</Dialog.Content>
</Dialog>
