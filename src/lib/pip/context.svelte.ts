import { CameraClient } from '@viamrobotics/sdk'
import {
	createResourceClient,
	createResourceQuery,
	createStreamClient,
} from '@viamrobotics/svelte-sdk'
import { getContext, setContext } from 'svelte'

const PIP_KEY = Symbol('pip-context')

interface PipContext {
	/** Called by PictureInPictureButton to start or stop PiP. */
	toggle(resourceName: string): Promise<void>

	setRate(rate: 'live' | number | false): void

	error: Error | undefined

	/** Whether the PictureInPicture is active */
	readyState: 'inactive' | 'loading' | 'active'

	/** The current resource streamed */
	resourceName: string | undefined
}

export function providePip(partID: () => string): PipContext {
	const video = document.createElement('video')
	video.muted = true
	video.autoplay = true
	video.controls = false
	video.playsInline = true
	video.ariaHidden = 'true'
	video.style = 'position:fixed; right: 0; bottom: 0; height: 1px; width: 1px; opacity: 0.01;'

	const canvas = document.createElement('canvas')
	const canvasCtx = canvas.getContext('2d')
	const canvasStream = canvas.captureStream()

	const img = document.createElement('img')

	let error = $state<Error>()
	let readyState = $state<'inactive' | 'loading' | 'active'>('inactive')
	let rate = $state<'live' | number | false>('live')
	let activeName = $state<string>()

	const cameraClient = $derived(
		activeName ? createResourceClient(CameraClient, partID, () => activeName ?? '') : undefined
	)
	const streamClient = $derived(
		activeName ? createStreamClient(partID, () => activeName ?? '') : undefined
	)
	const imageQuery = $derived(
		cameraClient?.current
			? createResourceQuery(cameraClient, 'getImages', () => ({
					enabled: rate !== 'live',
					refetchInterval: typeof rate === 'number' ? rate : false,
					refetchIntervalInBackground: activeName === cameraClient?.current?.name,
				}))
			: undefined
	)

	const mediaStream = $derived<MediaStream | null>(
		(rate === 'live' ? streamClient?.mediaStream : canvasStream) ?? null
	)

	$effect(() => {
		document.body.append(video)
		return () => {
			video.remove()
		}
	})

	$effect(() => {
		video.srcObject = mediaStream
		return () => {
			video.srcObject = null
		}
	})

	$effect(() => {
		const currentRate = rate

		if (currentRate === 'live') return

		const image = imageQuery?.data?.images[0]

		if (!image) return

		if (img.src) URL.revokeObjectURL(img.src)

		img.src = URL.createObjectURL(
			new Blob([new Uint8Array(image.image)], {
				type: image.mimeType || 'image/jpeg',
			})
		)

		const drawImage = () => {
			canvas.width = img.naturalWidth
			canvas.height = img.naturalHeight
			canvasCtx?.drawImage(img, 0, 0)
		}

		img.addEventListener('load', drawImage)

		return () => {
			if (img.src) URL.revokeObjectURL(img.src)
			img.removeEventListener('load', drawImage)
		}
	})

	const toggle = async () => {
		if (
			activeName === undefined &&
			readyState === 'active' &&
			document.pictureInPictureElement === video
		) {
			try {
				await document.exitPictureInPicture()
				readyState = 'inactive'
				error = undefined
			} catch (nextError) {
				error = nextError as Error
			}
			return
		}

		readyState = 'loading'

		// Wait for the new stream's metadata to load before requesting PiP,
		// otherwise the browser throws InvalidStateError.
		if (video.readyState < 1 /* HAVE_METADATA */) {
			await new Promise<void>((resolve) => {
				video!.addEventListener('loadedmetadata', () => resolve(), { once: true })
			})
		}

		try {
			await video.requestPictureInPicture()
			readyState = 'active'
			error = undefined
		} catch (nextError) {
			error = nextError as Error
		}
	}

	const context: PipContext = {
		async toggle(resourceName) {
			activeName = activeName === resourceName ? undefined : resourceName

			await toggle()
		},

		setRate(newRate) {
			rate = newRate
		},

		get error() {
			return error
		},

		get readyState() {
			return readyState
		},

		get resourceName() {
			return activeName
		},
	}

	setContext(PIP_KEY, context)

	return context
}

export function usePip(): PipContext {
	const ctx = getContext<PipContext | undefined>(PIP_KEY)

	if (!ctx) {
		throw new Error('usePipContext must be called after providePip()')
	}

	return ctx
}
