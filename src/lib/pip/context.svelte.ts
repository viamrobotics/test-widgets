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

	/** Register the media stream from the main camera view when its card is open. */
	setStream(resourceName: string, stream: MediaStream | null): void

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

	const externalStreams = new Map<string, MediaStream>()
	let externalStreamVersion = $state(0)

	let error = $state<Error>()
	let readyState = $state<'inactive' | 'loading' | 'active'>('inactive')
	let rate = $state<'live' | number | false>('live')
	let activeName = $state<string>()

	const externalStream = $derived.by(() => {
		void externalStreamVersion
		return activeName ? externalStreams.get(activeName) : undefined
	})

	const needsOwnedStream = $derived(activeName !== undefined && !externalStream)

	const cameraClient = $derived(
		needsOwnedStream && activeName
			? createResourceClient(CameraClient, partID, () => activeName ?? '')
			: undefined
	)
	const streamClient = $derived(
		needsOwnedStream && activeName ? createStreamClient(partID, () => activeName ?? '') : undefined
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

	const ownedMediaStream = $derived<MediaStream | null>(
		needsOwnedStream ? ((rate === 'live' ? streamClient?.mediaStream : canvasStream) ?? null) : null
	)

	const playbackStream = $derived(externalStream ?? ownedMediaStream)

	const setStream = (resourceName: string, stream: MediaStream | null) => {
		if (stream) {
			externalStreams.set(resourceName, stream)
		} else {
			externalStreams.delete(resourceName)
		}
		externalStreamVersion++
	}

	$effect(() => {
		document.body.append(video)

		const handleLeave = () => {
			readyState = 'inactive'
			activeName = undefined
			error = undefined
		}

		video.addEventListener('leavepictureinpicture', handleLeave)

		return () => {
			video.removeEventListener('leavepictureinpicture', handleLeave)
			video.remove()
		}
	})

	$effect(() => {
		video.srcObject = playbackStream

		return () => {
			video.srcObject = null
		}
	})

	$effect(() => {
		const currentRate = rate

		if (!needsOwnedStream || currentRate === 'live') return

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

	const toggle = async (resourceName: string) => {
		if (activeName === resourceName && document.pictureInPictureElement === video) {
			try {
				await document.exitPictureInPicture()
				activeName = undefined
				readyState = 'inactive'
				error = undefined
			} catch (nextError) {
				error = nextError as Error
			}
			return
		}

		activeName = resourceName
		readyState = 'loading'

		try {
			const stream = ownedMediaStream
			video.srcObject = stream

			// Wait for the stream's metadata to load before requesting PiP,
			// otherwise the browser throws InvalidStateError.
			if (video.readyState < 1 /* HAVE_METADATA */) {
				await new Promise<void>((resolve) => {
					video.addEventListener('loadedmetadata', () => resolve(), { once: true })
				})
			}

			await video.requestPictureInPicture()
			readyState = 'active'
			error = undefined
		} catch (nextError) {
			readyState = 'inactive'
			activeName = undefined
			error = nextError as Error
		}
	}

	const context: PipContext = {
		toggle,
		setStream,

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
