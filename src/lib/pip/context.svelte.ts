import { getContext, setContext } from 'svelte'

const PIP_KEY = Symbol('pip-context')

interface PipContext {
	/** Called by PictureInPictureButton to start or stop PiP. */
	toggle(resourceName: string): Promise<void>

	/** Register the media stream from the main camera view for PiP reuse. */
	setStream(resourceName: string, stream: MediaStream | null): void

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

	const streams = new Map<string, MediaStream>()
	const streamWaiters = new Map<string, Set<(stream: MediaStream) => void>>()

	let error = $state<Error>()
	let readyState = $state<'inactive' | 'loading' | 'active'>('inactive')
	let activeName = $state<string>()

	const resolveStreamWaiters = (resourceName: string, stream: MediaStream) => {
		const waiters = streamWaiters.get(resourceName)
		if (!waiters) return
		for (const resolve of waiters) {
			resolve(stream)
		}
		streamWaiters.delete(resourceName)
	}

	const waitForStream = (resourceName: string, timeoutMs = 15_000) =>
		new Promise<MediaStream>((resolve, reject) => {
			const existing = streams.get(resourceName)
			if (existing) {
				resolve(existing)
				return
			}

			const waiters = streamWaiters.get(resourceName) ?? new Set()
			waiters.add(resolve)
			streamWaiters.set(resourceName, waiters)

			setTimeout(() => {
				if (!streams.has(resourceName)) {
					waiters.delete(resolve)
					if (waiters.size === 0) {
						streamWaiters.delete(resourceName)
					}
					reject(new Error('No stream available for picture-in-picture'))
				}
			}, timeoutMs)
		})

	const setStream = (resourceName: string, stream: MediaStream | null) => {
		if (stream) {
			streams.set(resourceName, stream)
			resolveStreamWaiters(resourceName, stream)
		} else {
			streams.delete(resourceName)
		}

		if (activeName !== resourceName) return

		video.srcObject = stream

		if (!stream && document.pictureInPictureElement === video) {
			void document.exitPictureInPicture()
		}
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
			const stream = await waitForStream(resourceName)
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
