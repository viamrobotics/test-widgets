<script lang="ts">
	import type { Snippet } from 'svelte'

	import { mdiCameraOutline, mdiPlayCircleOutline } from '@mdi/js'
	import { Select } from '@viamrobotics/prime-controls'
	import { Checkbox, Field, Icon, Label } from '@viamrobotics/prime-ui'
	import { hasPip } from '#lib/pip/context.svelte.js'

	import type { MediaFitState } from './media-fit.svelte'
	import type {
		MediaFrameAddToDataset,
		MediaFrameCapture,
		MediaFramePictureInPicture,
	} from './media-frame-capture'

	import HeldBack from '../HeldBack.svelte'
	import AddToDatasetDialog from './AddToDatasetDialog.svelte'
	import { isMediaFit, MEDIA_FIT_LABELS, type MediaFit } from './media-fit'
	import PictureInPictureAction from './PictureInPictureAction.svelte'
	import { screenshotFileName } from './screenshot-file-name'
	import { toError } from './to-error'
	import { useReportedError } from './use-reported-error.svelte'

	/** Every control is off until its host sets it. */
	interface Props {
		/** Names the frame's group, such as the host section's heading. */
		label: string
		media: Snippet
		/** CSS `aspect-ratio` of the media box. */
		aspectRatio?: string
		/** Drawn over the media, inside its bounds. */
		overlay?: Snippet
		/** With `onStart` set, `false` shows the splash. */
		running?: boolean
		onStart?: () => void
		startLabel?: string
		/** Bind it to show the `Start feed automatically` checkbox. */
		startAutomatically?: boolean
		fps?: number
		screenshot?: () => Promise<MediaFrameCapture>
		pictureInPicture?: MediaFramePictureInPicture
		addToDataset?: MediaFrameAddToDataset
		/** Bind it to show the `Mouse position tooltip` checkbox. */
		cursorPosition?: boolean
		/** The host's own controls, after the action row. */
		children?: Snippet
		/** From `createMediaFit`. Shows the Fit select as the last row. */
		fit?: MediaFitState
	}

	let {
		label,
		media,
		aspectRatio = '16 / 9',
		overlay,
		running = true,
		onStart,
		startLabel = 'Start feed',
		startAutomatically = $bindable(),
		fps,
		screenshot,
		pictureInPicture,
		addToDataset,
		cursorPosition = $bindable(),
		children,
		fit,
	}: Props = $props()

	const id = $props.id()
	const fitLabelId = `${id}-fit`

	// Applied to the media box's children, so the element the host's snippet renders takes it.
	const OBJECT_FIT_CLASSES: Record<MediaFit, string | undefined> = {
		'keep-ratio': undefined,
		fit: '*:object-contain',
		stretch: '*:object-fill',
		crop: '*:object-cover',
	}

	// Firefox plays any video in picture-in-picture natively, so it gets no button of its own.
	const isFirefox = navigator.userAgent.toLowerCase().includes('firefox')

	// With no `providePip` above the frame, picture-in-picture hides instead of throwing.
	const isPipAvailable = hasPip() && !isFirefox

	const isShowingSplash = $derived(onStart !== undefined && !running)
	const notStartedReason = $derived(isShowingSplash ? `Press ${startLabel} first.` : undefined)

	let frame = $state<HTMLElement>()
	let startButton = $state<HTMLButtonElement>()
	let hadFocusBeforeSwap = false

	// The splash swap removes the start button, and a stop can remove the host's controls.
	// Focus that was inside the frame stays inside it, so the next Tab does not restart the page.
	$effect.pre(() => {
		void isShowingSplash
		hadFocusBeforeSwap = frame?.contains(document.activeElement) ?? false
	})
	$effect(() => {
		const fallback = isShowingSplash ? startButton : frame
		if (!hadFocusBeforeSwap || frame?.contains(document.activeElement)) return
		fallback?.focus()
	})
	const hasActions = $derived(
		screenshot !== undefined ||
			(pictureInPicture !== undefined && isPipAvailable) ||
			addToDataset !== undefined
	)
	const hasControls = $derived(
		startAutomatically !== undefined ||
			hasActions ||
			cursorPosition !== undefined ||
			children !== undefined ||
			fit !== undefined
	)

	const currentFit = $derived<MediaFit>(fit?.current ?? 'keep-ratio')
	// Every fit but Keep ratio fills the height its host gives the frame, so nothing scrolls.
	const isFillingFrame = $derived(currentFit !== 'keep-ratio')
	const mediaBoxAspectRatio = $derived(isFillingFrame ? undefined : aspectRatio)

	const fitItems = $derived(
		(fit?.fits ?? []).map((value) => ({ value, label: MEDIA_FIT_LABELS[value] }))
	)
	const getFit = () => currentFit
	const setFit = (next: string | undefined) => {
		if (fit && isMediaFit(next)) fit.current = next
	}

	let screenshotError = $state<Error | null>(null)
	let isSavingScreenshot = $state(false)

	useReportedError(() => screenshotError)

	const downloadCapture = (capture: MediaFrameCapture) => {
		const blob = new Blob([new Uint8Array(capture.binaryData)], { type: capture.mimeType })
		const url = URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.href = url
		link.download = screenshotFileName(label, capture.mimeType, new Date())
		link.click()
		URL.revokeObjectURL(url)
	}

	const saveScreenshot = async () => {
		// A press while the capture is in flight is dropped, never queued.
		if (!screenshot || isSavingScreenshot || isShowingSplash) return
		isSavingScreenshot = true
		try {
			downloadCapture(await screenshot())
			screenshotError = null
		} catch (error) {
			screenshotError = toError(error)
		} finally {
			isSavingScreenshot = false
		}
	}

	const screenshotStatus = $derived(isSavingScreenshot ? 'Saving screenshot' : '')
	const screenshotBlockedReason = $derived(
		notStartedReason ??
			(isSavingScreenshot ? 'Wait for the screenshot in flight to finish.' : undefined)
	)
</script>

{#snippet checkboxField(
	fieldLabel: string,
	getChecked: () => boolean,
	setChecked: (checked: boolean) => void
)}
	<Field
		label={fieldLabel}
		class="flex items-center gap-2"
	>
		<Checkbox bind:checked={getChecked, setChecked} />
		<Label />
	</Field>
{/snippet}

<div
	bind:this={frame}
	role="group"
	aria-label={label}
	tabindex="-1"
	class={['flex w-full min-w-0 flex-col', isFillingFrame && 'h-full']}
>
	<div
		class={[
			'relative w-full overflow-hidden',
			isFillingFrame && 'min-h-0 flex-1',
			OBJECT_FIT_CLASSES[currentFit],
		]}
		style:aspect-ratio={mediaBoxAspectRatio}
	>
		{@render media()}

		{#if isShowingSplash}
			<div class="bg-medium absolute inset-0 flex items-center justify-center">
				<button
					bind:this={startButton}
					type="button"
					class="button button-dark"
					onclick={onStart}
				>
					<Icon
						icon={mdiPlayCircleOutline}
						size="sm"
					/>
					{startLabel}
				</button>
			</div>
		{:else}
			{@render overlay?.()}
			{#if fps !== undefined}
				<span
					class="badge badge-neutral pointer-events-none absolute bottom-2 left-2 z-10 font-mono"
				>
					{fps.toFixed(1)}fps
				</span>
			{/if}
		{/if}
	</div>

	{#if hasControls}
		<div class="flex flex-col gap-3 p-4">
			{#if startAutomatically !== undefined}
				{@render checkboxField(
					'Start feed automatically',
					() => startAutomatically ?? false,
					(checked) => {
						startAutomatically = checked
					}
				)}
			{/if}

			{#if hasActions}
				<div class="flex flex-wrap items-center gap-2">
					{#if screenshot}
						<HeldBack reason={screenshotBlockedReason}>
							{#snippet children(heldBack)}
								<button
									type="button"
									class="button button-xs"
									{...heldBack}
									onclick={saveScreenshot}
								>
									{#if isSavingScreenshot}
										<span
											class="progress-dots"
											aria-hidden="true"
										></span>
									{:else}
										<Icon
											icon={mdiCameraOutline}
											size="sm"
										/>
									{/if}
									Screenshot
								</button>
							{/snippet}
						</HeldBack>
						<span
							class="sr-only"
							role="status"
						>
							{screenshotStatus}
						</span>
					{/if}
					{#if pictureInPicture && isPipAvailable}
						<PictureInPictureAction
							{pictureInPicture}
							blockedReason={notStartedReason}
						/>
					{/if}
					{#if addToDataset}
						<AddToDatasetDialog
							{addToDataset}
							blockedReason={notStartedReason}
						/>
					{/if}
				</div>
			{/if}

			{#if cursorPosition !== undefined}
				{@render checkboxField(
					'Mouse position tooltip',
					() => cursorPosition ?? false,
					(checked) => {
						cursorPosition = checked
					}
				)}
			{/if}

			{@render children?.()}

			{#if fit}
				<div class="flex items-center gap-2">
					<span
						id={fitLabelId}
						class="text-subtle-1 shrink-0 text-xs"
					>
						Fit
					</span>
					<div class="max-w-50 min-w-0 flex-1">
						<Select
							items={fitItems}
							bind:value={getFit, setFit}
							aria-labelledby={fitLabelId}
						/>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
