import { CameraClient, type StreamClient } from '@viamrobotics/sdk'
import { getContext, setContext } from 'svelte'

const PIP_KEY = Symbol('pip-context')

export interface PipContext {
	/** Returns true when the given resource is currently showing in PiP. */
	isShowingPip(resourceName: string): boolean

	/**
	 * Called by LiveOrPollingVideo whenever its stream changes.
	 * Keeps the PipManager's video in sync while the card is expanded.
	 */
	setStream(resourceName: string, stream: MediaStream | null): void

	/**
	 * Called by LiveOrPollingVideo on cleanup when PiP is active and the
	 * component is about to unmount (live-stream mode).
	 * Transfers ownership of the StreamClient to the context so PipManager
	 * can keep the WebRTC stream alive and clean it up when PiP ends.
	 */
	handoffLive(params: { resourceName: string; streamClient: StreamClient }): void

	/**
	 * Called by LiveOrPollingVideo on cleanup when PiP is active and the
	 * component is about to unmount (polling mode).
	 * PipManager takes over drawing to the canvas so the PiP window keeps
	 * updating without the card being mounted.
	 */
	handoffPolling(params: {
		resourceName: string
		canvas: HTMLCanvasElement
		robotClient: CameraClient
		pollIntervalMs: number
	}): void

	/** Called by PictureInPictureButton to start or stop PiP. */
	togglePip(resourceName: string): Promise<void>

	// Internal API used by PipManager.svelte to wire itself up.
	_onVideoElement(el: HTMLVideoElement | undefined): void
	_onEnterPip(): void
	_onLeavePip(): void
}

export function createPipContext(): PipContext {
	let isActive = $state(false)
	let activeResourceName = $state<string | null>(null)
	let videoEl: HTMLVideoElement | undefined

	// Registry of streams from mounted camera cards.
	const streamRegistry = new Map<string, MediaStream | null>()

	// Background state used when the source card unmounts while PiP is active.
	let bgCleanup: (() => void) | undefined

	const stopBackground = async () => {
		bgCleanup?.()
		bgCleanup = undefined
	}

	const context: PipContext = {
		isShowingPip(resourceName) {
			return isActive && activeResourceName === resourceName
		},

		setStream(resourceName, stream) {
			streamRegistry.set(resourceName, stream)
			if (videoEl) {
				if (activeResourceName === resourceName) {
					// Keep the active PiP source in sync.
					videoEl.srcObject = stream
				} else if (!isActive && stream) {
					// Pre-load any incoming stream so the video element is already
					// playing by the time the user clicks "Toggle PiP". Without this,
					// requestPictureInPicture() throws because the video isn't loaded yet.
					videoEl.srcObject = stream
				}
			}
		},

		handoffLive({ resourceName, streamClient }) {
			if (!isActive || activeResourceName !== resourceName) return
			// The MediaStream is still alive; we just need to remove the stream
			// from the WebRTC connection when PiP ends.
			bgCleanup = () => {
				streamClient.remove(resourceName).catch((error: unknown) => {
					console.error('Failed to remove live stream after PiP exit', error)
				})
			}
		},

		handoffPolling({ resourceName, canvas, robotClient, pollIntervalMs }) {
			if (!isActive || activeResourceName !== resourceName) return

			const canvasCtx = canvas.getContext('2d')
			const img = document.createElement('img')

			const drawImage = () => {
				canvas.width = img.naturalWidth
				canvas.height = img.naturalHeight
				canvasCtx?.drawImage(img, 0, 0)
			}
			img.addEventListener('load', drawImage)

			let prevSrc = ''
			let polling = false
			const intervalId = window.setInterval(() => {
				if (polling) return
				polling = true
				robotClient
					.getImages()
					.then((result) => {
						const image = result?.images?.[0]
						if (!image?.image) return
						if (prevSrc) URL.revokeObjectURL(prevSrc)
						prevSrc = URL.createObjectURL(
							new Blob([new Uint8Array(image.image)], {
								type: image.mimeType || 'image/jpeg',
							})
						)
						img.src = prevSrc
					})
					.catch((error: unknown) => {
						console.error('PiP background polling error', error)
					})
					.finally(() => {
						polling = false
					})
			}, pollIntervalMs)

			bgCleanup = () => {
				clearInterval(intervalId)
				if (prevSrc) URL.revokeObjectURL(prevSrc)
				img.removeEventListener('load', drawImage)
			}
		},

		async togglePip(resourceName) {
			if (document.pictureInPictureElement) {
				await document.exitPictureInPicture()
			} else {
				activeResourceName = resourceName
				// Ensure the video is showing the right stream (handles the case where
				// multiple cameras are open and a different one was pre-loaded).
				if (videoEl) {
					const stream = streamRegistry.get(resourceName) ?? null
					if (videoEl.srcObject !== stream) {
						videoEl.srcObject = stream
						// Wait for the new stream's metadata to load before requesting PiP,
						// otherwise the browser throws InvalidStateError.
						if (videoEl.readyState < 1 /* HAVE_METADATA */) {
							await new Promise<void>((resolve) => {
								videoEl!.addEventListener('loadedmetadata', () => resolve(), { once: true })
							})
						}
					}
					await videoEl.requestPictureInPicture()
				}
			}
		},

		_onVideoElement(el) {
			videoEl = el
		},

		_onEnterPip() {
			isActive = true
		},

		async _onLeavePip() {
			isActive = false
			activeResourceName = null
			await stopBackground()
		},
	}

	setContext(PIP_KEY, context)
	return context
}

export function usePipContext(): PipContext {
	const ctx = getContext<PipContext | undefined>(PIP_KEY)
	if (!ctx) {
		throw new Error('usePipContext must be called within a PipContext provider')
	}
	return ctx
}
