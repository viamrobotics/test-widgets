import { getContext, setContext } from 'svelte'

const PIP_KEY = Symbol('pip-context')

interface PipContext {
	/** Called by PictureInPictureButton to start or stop PiP. */
	toggle(resourceName: string): Promise<void>

	/** Register the media stream from the main camera view when its card is open. */
	setStream(resourceName: string, stream: MediaStream | null): void

	/** Look up a previously registered stream, e.g. one kept alive for PiP after its card closed. */
	getStream(resourceName: string): MediaStream | undefined

	error: Error | undefined

	/** Whether the PictureInPicture is active */
	readyState: 'inactive' | 'loading' | 'active'

	/** The current resource streamed */
	resourceName: string | undefined
}

export function providePip(): PipContext {
	const video = document.createElement('video')
	video.muted = true
	video.autoplay = true
	video.controls = false
	video.playsInline = true
	video.ariaHidden = 'true'
	video.style = 'position:fixed; right: 0; bottom: 0; height: 1px; width: 1px; opacity: 0.01;'

	const externalStreams = new Map<string, MediaStream>()
	let externalStreamVersion = $state(0)

	let error = $state<Error>()
	let readyState = $state<'inactive' | 'loading' | 'active'>('inactive')
	let activeName = $state<string>()

	const playbackStream = $derived.by(() => {
		void externalStreamVersion
		return activeName ? externalStreams.get(activeName) : undefined
	})

	const setStream = (resourceName: string, stream: MediaStream | null) => {
		if (stream) {
			externalStreams.set(resourceName, stream)
		} else {
			externalStreams.delete(resourceName)
		}
		externalStreamVersion++
	}

	const getStream = (resourceName: string) => externalStreams.get(resourceName)

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
		video.srcObject = playbackStream ?? null

		return () => {
			video.srcObject = null
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
			const stream = externalStreams.get(resourceName) ?? null
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
		getStream,

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
