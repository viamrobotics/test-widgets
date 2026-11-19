<script lang="ts">
	import type { Snippet } from 'svelte'

	import { mdiCameraOutline, mdiPlayCircleOutline } from '@mdi/js'
	import { Checkbox, Field, Icon, Label } from '@viamrobotics/prime-ui'

	import { hasPip } from '$lib/pip/context.svelte'

	import type {
		MediaFrameAddToDataset,
		MediaFrameCapture,
		MediaFramePictureInPicture,
	} from './media-frame-capture'

	import AddToDatasetDialog from './add-to-dataset-dialog.svelte'
	import PictureInPictureAction from './picture-in-picture-action.svelte'
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
	}: Props = $props()

	// Firefox plays any video in picture-in-picture natively, so it gets no button of its own.
	const isFirefox = navigator.userAgent.toLowerCase().includes('firefox')

	// With no `providePip` above the frame, picture-in-picture hides instead of throwing.
	const isPipAvailable = hasPip() && !isFirefox

	const isShowingSplash = $derived(onStart !== undefined && !running)
	const hasActions = $derived(
		screenshot !== undefined ||
			(pictureInPicture !== undefined && isPipAvailable) ||
			addToDataset !== undefined
	)
	const hasControls = $derived(
		startAutomatically !== undefined ||
			hasActions ||
			cursorPosition !== undefined ||
			children !== undefined
	)

	let screenshotError = $state<Error | null>(null)

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
		if (!screenshot) return
		try {
			downloadCapture(await screenshot())
			screenshotError = null
		} catch (error) {
			screenshotError = toError(error)
		}
	}
</script>

{#snippet checkboxField(
	fieldLabel: string,
	getChecked: () => boolean,
	setChecked: (checked: boolean) => void
)}
	<Field class="flex items-center gap-2">
		<Checkbox bind:checked={getChecked, setChecked} />
		<Label>{fieldLabel}</Label>
	</Field>
{/snippet}

<div
	role="group"
	aria-label={label}
	class="flex w-full min-w-0 flex-col"
>
	<div
		class="relative w-full overflow-hidden"
		style:aspect-ratio={aspectRatio}
	>
		{@render media()}

		{#if isShowingSplash}
			<div class="bg-medium absolute inset-0 flex items-center justify-center">
				<button
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
				<div
					class="pointer-events-none absolute bottom-2 left-2 z-10 rounded-[3px] bg-black/30 px-1 py-0.5 text-right font-mono text-xs text-white"
				>
					{fps.toFixed(1)}fps
				</div>
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
						<button
							type="button"
							class="button button-xs"
							disabled={isShowingSplash}
							onclick={saveScreenshot}
						>
							<Icon
								icon={mdiCameraOutline}
								size="sm"
							/>
							Screenshot
						</button>
					{/if}
					{#if pictureInPicture && isPipAvailable}
						<PictureInPictureAction
							{pictureInPicture}
							disabled={isShowingSplash}
						/>
					{/if}
					{#if addToDataset}
						<AddToDatasetDialog
							{addToDataset}
							disabled={isShowingSplash}
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
		</div>
	{/if}
</div>
