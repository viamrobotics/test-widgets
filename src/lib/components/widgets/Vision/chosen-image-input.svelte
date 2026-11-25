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

	interface Props {
		/** Holds Execute back while a field in `children` is invalid. */
		disabled?: boolean
		/** Runs on Execute with the chosen image. */
		onExecute: (image: ChosenImage) => void
		/** Fields drawn between the chooser and Execute. */
		children?: Snippet
	}

	const { disabled = false, onExecute, children }: Props = $props()

	const ACCEPTED_TYPES = ['image/jpeg', 'image/png'] as const satisfies MimeType[]

	type AcceptedType = (typeof ACCEPTED_TYPES)[number]

	const ACCEPTED_TYPE_SET: ReadonlySet<string> = new Set(ACCEPTED_TYPES)

	const isAcceptedType = (type: string): type is AcceptedType => ACCEPTED_TYPE_SET.has(type)

	let files = $state.raw<File[]>([])
	let chosen = $state<ChosenImage>()
	let readError = $state<string>()

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
		if (file === undefined) {
			chosen = undefined
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
		<button
			type="button"
			class="button button-compact"
			disabled={chosen === undefined || disabled}
			onclick={() => {
				if (chosen !== undefined) {
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
	</div>
</div>
