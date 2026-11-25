<script lang="ts">
	import type { QueryObserverResult } from '@tanstack/svelte-query'
	import type { Snippet } from 'svelte'
	import type { ClassValue } from 'svelte/elements'

	import * as Sentry from '@sentry/svelte'
	import { CameraClient, type RobotClient, StreamClient } from '@viamrobotics/sdk'
	import { useRobotClient } from '@viamrobotics/svelte-sdk'
	import { useResizeObserver } from 'runed'
	import { untrack } from 'svelte'

	import { toError } from '$lib/components/media-frame/to-error'
	import Progress from '$lib/components/progress.svelte'
	import { Section } from '$lib/components/section'
	import { formatNumeric } from '$lib/format'
	import { useMeasureFps } from '$lib/fps.svelte'
	import { usePip } from '$lib/pip/context.svelte'

	import { getBlobForViamDepth, VIAM_DEPTH_MIME_TYPE } from './decode-viam-depth'
	import { pickImageForSource } from './pick-image-for-source'
	import { pixelUnderCursor } from './pixel-under-cursor'
	import SetStreamOptions from './set-stream-options.svelte'

	/** One presented video frame: the measured frame rate and the frame's own size in pixels. */
	interface VideoFrameInfo {
		fps: number
		width: number
		height: number
	}

	interface Props {
		resourceName: string
		partID: string
		showResolutionOptions?: boolean
		isLive: boolean
		data: QueryObserverResult<Awaited<ReturnType<CameraClient['getImages']>>>['data']
		error?: QueryObserverResult<Awaited<ReturnType<CameraClient['getImages']>>>['error']
		isLoading: boolean
		videoClass?: string
		showMousePositionTooltip?: boolean
		sourceName?: string
		refetch: () => Promise<unknown>
		/** Host content rendered directly under the video, above the SetStreamOptions section. */
		controls?: Snippet
		/** Called on each presented frame. When set, the host draws the fps badge, so the video omits its own. */
		onFrame?: (frame: VideoFrameInfo) => void
		/**
		 * Set it to take polling errors off the overlay. The feed keeps its last frame and the next poll
		 * retries. Each failed poll or undecodable frame arrives here, then `undefined` once one succeeds.
		 */
		onPollingError?: (error: Error | undefined) => void
		/**
		 * Set it to take Live stream errors off the overlay. The stream still stops, and each error
		 * arrives here, so the host can offer the restart.
		 */
		onStreamError?: (error: Error) => void
		/** Classes on the root element, such as `size-full` to fill a media box. */
		class?: ClassValue
	}

	const {
		resourceName,
		partID,
		showResolutionOptions,
		isLive,
		data,
		error,
		isLoading,
		videoClass = '',
		showMousePositionTooltip = false,
		sourceName = '',
		refetch,
		controls,
		onFrame,
		onPollingError,
		onStreamError,
		class: className,
	}: Props = $props()

	let videoElement = $state.raw<HTMLVideoElement>()
	let isStreamLoading = $state(false)
	let streamError = $state.raw<Error>()
	// A polled frame that could not be decoded, cleared by the next frame that could.
	let frameError = $state.raw<Error>()
	let vfcID = 0
	let liveStreamStart: DOMHighResTimeStamp | undefined

	const pip = usePip()

	const setMediaStream = (mediaStream: MediaStream | null) => {
		if (mediaStream) {
			pip.setStream(resourceName, mediaStream)
		}

		if (videoElement) {
			// TODO(2025-01-31): Remove these function guards.
			// Sentry has some error traces where "cancelVideoFrameCallback is not a function".
			// Firefox only added this a few versions ago, so this guard can be removed eventually.
			// https://caniuse.com/?search=cancelvideoframecallback
			if (typeof videoElement.cancelVideoFrameCallback === 'function') {
				videoElement.cancelVideoFrameCallback(vfcID)
			}
			if (typeof videoElement.requestVideoFrameCallback === 'function' && mediaStream !== null) {
				vfcID = videoElement.requestVideoFrameCallback((now) => {
					if (liveStreamStart) {
						Sentry.setMeasurement(
							'control.camera.timeToVideoFrame',
							now - liveStreamStart,
							'millisecond'
						)
					}
					isStreamLoading = false
				})
			}
			videoElement.srcObject = mediaStream
		}
	}

	// For live streams, set the media stream when there is a new video track.
	const client = useRobotClient(() => partID)

	const handleTrack = (event: unknown) => {
		if (liveStreamStart) {
			Sentry.setMeasurement(
				'control.camera.timeToTrack',
				performance.now() - liveStreamStart,
				'millisecond'
			)
		}
		const [eventStream] = (event as { streams: MediaStream[] }).streams

		if (!eventStream || eventStream.id !== resourceName) {
			return
		}

		setMediaStream(eventStream)
	}

	// For polling, create the query and render the result to an image
	// tag. Then draw the image onto a canvas. Finally, capture the
	// canvas in a media stream
	const img = document.createElement('img')
	const canvas = document.createElement('canvas')
	const canvasCtx = canvas.getContext('2d')
	const drawImage = () => {
		canvas.width = img.naturalWidth
		canvas.height = img.naturalHeight
		canvasCtx?.drawImage(img, 0, 0)
	}

	let streamClient: StreamClient | undefined

	const disableStream = async () => {
		try {
			isStreamLoading = false
			const last = streamClient
			streamClient = undefined
			last?.off('track', handleTrack)
			await last?.remove(resourceName)
			liveStreamStart = undefined
		} catch (nextError: unknown) {
			streamError = toError(nextError)
		}
	}

	// Until the first frame arrives the video has no size of its own, so it holds the feed's usual ratio.
	let hasFrame = $state(false)
	const updateHasFrame = () => {
		hasFrame = (videoElement?.videoWidth ?? 0) > 0
	}

	const startStream = async (robotClient: RobotClient, name: string, live: boolean) => {
		try {
			streamError = undefined
			await disableStream()
			// Don't setMediaStream(null) here or else the PiP thrashes.

			if (live) {
				// Live streams

				isStreamLoading = true
				liveStreamStart = performance.now()
				streamClient = new StreamClient(robotClient)
				streamClient.on('track', handleTrack)
				await streamClient.getStream(name)
			} else {
				// Polling

				// Trigger a refetch on initial change.
				await refetch()

				setMediaStream(canvas.captureStream())
			}
		} catch (nextError) {
			streamError = toError(nextError)
		}
	}

	const pollingError = $derived(error ?? frameError)
	const isReportingPollingErrors = $derived(onPollingError !== undefined)
	const overlayPollingError = $derived(isReportingPollingErrors ? undefined : pollingError)
	// The live stream's error while Live, and the polling query's or the frame decode's otherwise, each stops the stream.
	const stoppingError = $derived(isLive ? streamError : overlayPollingError)
	// One overlay shows the stopping error, unless the host takes the live stream's.
	const lastError = $derived(isLive && onStreamError ? undefined : stoppingError)

	// A polling error on the overlay pauses the stream until it clears. A live stream error stays until the stream's inputs change.
	// A reported polling error is not read here, so it never restarts the stream: the next scheduled poll is the retry.
	$effect(() => {
		const isPollingBlocked = !isLive && overlayPollingError !== undefined
		if (client.current && !isPollingBlocked) {
			void startStream(client.current, resourceName, isLive)
		}
	})

	$effect(() => {
		const report = onPollingError
		if (!report) return
		report(pollingError)
		return () => {
			report(undefined)
		}
	})

	$effect(() => {
		if (isLive && streamError) onStreamError?.(streamError)
	})

	$effect(() => {
		return () =>
			untrack(() => {
				disableStream().then(() => {
					pip.setStream(resourceName, null)
					setMediaStream(null)
				})
			})
	})

	const stopStream = async () => {
		await disableStream()
		setMediaStream(null)
	}

	$effect(() => {
		if (stoppingError) {
			void stopStream()
		}
	})

	$effect(() => {
		img.addEventListener('load', drawImage)

		return () => {
			img.removeEventListener('load', drawImage)
		}
	})

	interface FrameDraw {
		cancelled: boolean
		objectUrl?: string
	}

	const decodeFrame = async (bytes: Uint8Array, mimeType: string) => {
		if (mimeType !== VIAM_DEPTH_MIME_TYPE) {
			return new Blob([new Uint8Array(bytes)], { type: mimeType || 'image/jpeg' })
		}
		return getBlobForViamDepth(bytes)
	}

	// Writes the decode result from the promise, after the effect that started it has returned.
	const drawFrame = async (bytes: Uint8Array, mimeType: string, draw: FrameDraw) => {
		const blob = await decodeFrame(bytes, mimeType)
		if (draw.cancelled) return
		if (!blob) {
			frameError = new Error('Failed to decode depth frame: truncated or corrupt buffer')
			return
		}
		frameError = undefined
		draw.objectUrl = URL.createObjectURL(blob)
		img.src = draw.objectUrl
	}

	$effect(() => {
		const matchingImage = pickImageForSource(data?.images, sourceName)
		if (!matchingImage?.image) {
			return
		}

		const draw: FrameDraw = { cancelled: false }
		void drawFrame(new Uint8Array(matchingImage.image), matchingImage.mimeType, draw)

		return () => {
			draw.cancelled = true
			if (draw.objectUrl) URL.revokeObjectURL(draw.objectUrl)
		}
	})

	let contentRect = $state.raw<DOMRect>()
	const overlayWidth = $derived(contentRect ? `${contentRect.width.toString()}px` : undefined)
	const overlayHeight = $derived(contentRect ? `${contentRect.height.toString()}px` : undefined)
	useResizeObserver(
		() => videoElement,
		([entry]) => {
			contentRect = entry.contentRect
		}
	)

	let hoverTooltipOpen = $state(false)
	let mouseHoverImagePosition = $state({ pctX: 0, pctY: 0, absX: 0, absY: 0 })
	let mouseHoverClientPosition = $state({ x: 0, y: 0 })

	const handleMouseMoveWithinVideo = (event: MouseEvent | WheelEvent) => {
		if (!videoElement || !contentRect || !showMousePositionTooltip) {
			return
		}

		mouseHoverClientPosition = { x: event.clientX, y: event.clientY }

		const rect = videoElement.getBoundingClientRect()
		// The fit draws the source inside the box at its own scale and offset, so the box fraction alone is not the source pixel.
		const pixel = pixelUnderCursor({
			offsetX: event.clientX - rect.left,
			offsetY: event.clientY - rect.top,
			boxWidth: rect.width,
			boxHeight: rect.height,
			sourceWidth: isLive ? videoElement.videoWidth : canvas.width,
			sourceHeight: isLive ? videoElement.videoHeight : canvas.height,
			objectFit: getComputedStyle(videoElement).objectFit,
		})
		mouseHoverImagePosition = {
			pctX: pixel.fractionX,
			pctY: pixel.fractionY,
			absX: pixel.x,
			absY: pixel.y,
		}
	}
	const handleMouseEnterVideo = () => {
		if (showMousePositionTooltip) {
			hoverTooltipOpen = true
		}
	}
	const handleMouseLeaveVideo = () => {
		hoverTooltipOpen = false
	}

	const fps = useMeasureFps()
	$effect(() => {
		let id: number | undefined

		const measure = (now: DOMHighResTimeStamp, metadata: VideoFrameCallbackMetadata) => {
			fps.measure(now)
			onFrame?.({ fps: fps.current, width: metadata.width, height: metadata.height })
			id = videoElement?.requestVideoFrameCallback?.(measure)
		}

		id = videoElement?.requestVideoFrameCallback?.(measure)
		return () => id && videoElement?.cancelVideoFrameCallback(id)
	})
</script>

<div class={['relative', className]}>
	<!-- One overlay merges the live stream error with the polling query's error. -->
	{#if lastError}
		<div
			class="bg-medium/50 absolute inset-0 flex items-center justify-center"
			style:width={overlayWidth}
			style:height={overlayHeight}
		>
			<Section.Error
				class="pb-4"
				error={lastError}
			/>
		</div>
	{:else if isLive ? isStreamLoading : isLoading}
		<div
			class="absolute inset-0"
			style:width={overlayWidth}
			style:height={overlayHeight}
		>
			<Progress />
		</div>
	{/if}
	{#if !onFrame}
		<div class="badge badge-neutral pointer-events-none absolute bottom-2 left-2 z-10 font-mono">
			{fps.current.toFixed(1)}fps
		</div>
	{/if}
	<video
		bind:this={videoElement}
		class={[videoClass, !hasFrame && 'aspect-video']}
		onloadedmetadata={updateHasFrame}
		onresize={updateHasFrame}
		onemptied={updateHasFrame}
		onmouseenter={handleMouseEnterVideo}
		onmouseleave={handleMouseLeaveVideo}
		onmousemove={handleMouseMoveWithinVideo}
		onwheel={handleMouseMoveWithinVideo}
		muted
		autoplay
		controls={false}
		playsinline
		aria-label={`${resourceName} stream`}
	>
	</video>
</div>

{#if hoverTooltipOpen}
	<div
		role="tooltip"
		class="bg-extralight fixed z-10 rounded-sm border-0 p-1 text-xs"
		style:left="{mouseHoverClientPosition.x + 10}px"
		style:top="{mouseHoverClientPosition.y + 10}px"
		onmouseenter={handleMouseEnterVideo}
		onmouseleave={handleMouseLeaveVideo}
		onmousemove={handleMouseMoveWithinVideo}
		onwheel={handleMouseMoveWithinVideo}
	>
		{Math.round(mouseHoverImagePosition.absX)}x{Math.round(mouseHoverImagePosition.absY)}
		<br />
		({formatNumeric(mouseHoverImagePosition.pctX * 100, 1)}%x{formatNumeric(
			mouseHoverImagePosition.pctY * 100,
			1
		)}%)
	</div>
{/if}

{@render controls?.()}

{#if showResolutionOptions && isLive}
	<SetStreamOptions
		{partID}
		{resourceName}
	/>
{/if}
