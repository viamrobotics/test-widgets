<script lang="ts">
	import '../../../../../app.css'

	import type { ComponentProps } from 'svelte'

	import { providePip } from '#lib/pip/context.svelte.js'

	import type { DatasetFormProps } from '../../media-frame-capture'

	import {
		provideSectionErrorReporter,
		type SectionErrorReporter,
	} from '../../../Section/section-error-reporter'
	import MediaFrame from '../../MediaFrame.svelte'

	type FrameProps = ComponentProps<typeof MediaFrame>

	interface Props {
		label?: string
		aspectRatio?: string
		running?: boolean
		onStart?: () => void
		startLabel?: string
		startAutomatically?: boolean
		fps?: number
		screenshot?: FrameProps['screenshot']
		pictureInPicture?: FrameProps['pictureInPicture']
		addToDataset?: FrameProps['addToDataset']
		cursorPosition?: boolean
		fit?: FrameProps['fit']
		/** Passes the fixture's dataset form in `addToDataset.form`. */
		withForm?: boolean
		withOverlay?: boolean
		withChildren?: boolean
		reporter?: SectionErrorReporter
		/** Classes on the pane around the frame, such as `w-80` for a 320 px pane. */
		paneClass?: string
	}

	let {
		label = 'GetImages',
		aspectRatio,
		running,
		onStart,
		startLabel,
		startAutomatically = $bindable(),
		fps,
		screenshot,
		pictureInPicture,
		addToDataset,
		cursorPosition = $bindable(),
		fit,
		withForm = false,
		withOverlay = false,
		withChildren = false,
		reporter,
		paneClass,
	}: Props = $props()

	providePip(() => 'test-part')
	provideSectionErrorReporter(() => reporter)

	const hostAddToDataset = $derived.by(() => {
		if (!addToDataset || !withForm) return addToDataset
		return { ...addToDataset, form: datasetForm }
	})
</script>

{#snippet media()}
	<div
		data-testid="media"
		class="bg-dark size-full"
	></div>
{/snippet}

{#snippet overlayPanel()}
	<div data-testid="overlay">Legend</div>
{/snippet}

{#snippet hostControls()}
	<div data-testid="host-controls">Refresh rate</div>
{/snippet}

{#snippet datasetForm(formProps: DatasetFormProps)}
	<label>
		Dataset
		<input type="text" />
	</label>
	<p data-testid="form-props">
		{formProps.resourceName}
		{formProps.methodName}
		{formProps.mimeType}
		{formProps.binaryData.length} bytes
	</p>
{/snippet}

<div
	data-testid="pane"
	class={paneClass}
>
	<MediaFrame
		{label}
		{media}
		{aspectRatio}
		overlay={withOverlay ? overlayPanel : undefined}
		{running}
		{onStart}
		{startLabel}
		bind:startAutomatically
		{fps}
		{screenshot}
		{pictureInPicture}
		addToDataset={hostAddToDataset}
		bind:cursorPosition
		{fit}
		children={withChildren ? hostControls : undefined}
	/>
</div>
