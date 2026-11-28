<script
	lang="ts"
	module
>
	import type { MimeType } from '@viamrobotics/sdk'

	/** An image file read for a vision request: its bytes, natural size, and mime type. */
	export interface ChosenImage {
		file: File
		bytes: Uint8Array
		width: number
		height: number
		mimeType: MimeType
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte'

	import { mdiPlayCircleOutline } from '@mdi/js'
	import { FileField } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'
	import HeldBack from '#lib/components/HeldBack.svelte'
	import StatusLine from '#lib/components/StatusLine.svelte'

	interface Props {
		/** Why Execute will not act, such as an invalid field in `children` or a request in flight. */
		blockedReason: string | undefined
		/** The request's state, drawn under Execute. An empty string is the empty state. */
		statusText: string
		/** Runs on Execute with the chosen image. */
		onExecute: (image: ChosenImage) => void
		/** Fields drawn between the chooser and Execute. */
		children?: Snippet
	}

	const { blockedReason, statusText, onExecute, children }: Props = $props()

	const ACCEPTED_TYPES = ['image/jpeg', 'image/png'] as const satisfies MimeType[]

	type AcceptedType = (typeof ACCEPTED_TYPES)[number]

	const ACCEPTED_TYPE_SET: ReadonlySet<string> = new Set(ACCEPTED_TYPES)

	const isAcceptedType = (type: string): type is AcceptedType => ACCEPTED_TYPE_SET.has(type)

	let files = $state.raw<File[]>([])
	let chosen = $state<ChosenImage>()
	let readError = $state<string>()

	const NO_IMAGE_REASON = 'Choose an image first.'

	const heldBackReason = $derived(chosen === undefined ? NO_IMAGE_REASON : blockedReason)

	// A later pick wins over an earlier one that is still being read.
	let latestPick = 0

	const readImage = async (file: File): Promise<ChosenImage> => {
		const mimeType = file.type
		if (!isAcceptedType(mimeType)) {
			throw new Error(`${file.name} is not a JPEG or PNG image`)
		}
		const url = URL.createObjectURL(file)
		try {
			const image = new Image()
			image.src = url
			await image.decode()
			const bytes = new Uint8Array(await file.arrayBuffer())
			return { file, bytes, width: image.naturalWidth, height: image.naturalHeight, mimeType }
		} finally {
			URL.revokeObjectURL(url)
		}
	}

	const setFiles = async (next: File[] | undefined) => {
		files = next ?? []
		latestPick += 1
		const pick = latestPick
		const file = files[0]
		// Cleared before the read, so Execute cannot send the last image while the field names a newer one.
		chosen = undefined
		if (file === undefined) {
			readError = undefined
			return
		}
		try {
			const image = await readImage(file)
			if (pick === latestPick) {
				chosen = image
				readError = undefined
			}
		} catch (error) {
			if (pick === latestPick) {
				chosen = undefined
				readError = error instanceof Error ? error.message : String(error)
			}
		}
	}
</script>

<div class="flex flex-col gap-2">
	<FileField
		label="Image"
		placeholder="No image chosen"
		accept={ACCEPTED_TYPES.join(',')}
		state={readError === undefined ? undefined : 'error'}
		hint={readError}
		bind:value={() => files, setFiles}
	/>

	{@render children?.()}

	<div class="flex justify-end">
		<HeldBack reason={heldBackReason}>
			{#snippet children(heldBack)}
				<button
					type="button"
					class="button button-compact"
					{...heldBack}
					onclick={() => {
						// The button stays focusable while held back, so a press then is dropped here.
						if (chosen !== undefined && heldBackReason === undefined) {
							onExecute(chosen)
						}
					}}
				>
					<Icon
						icon={mdiPlayCircleOutline}
						size="sm"
					/>
					Execute
				</button>
			{/snippet}
		</HeldBack>
	</div>
	<StatusLine text={statusText} />
</div>
