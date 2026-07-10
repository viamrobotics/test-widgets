<script lang="ts">
	import * as Sentry from '@sentry/svelte'
	import { createMutation, type QueryObserverResult } from '@tanstack/svelte-query'
	import { Button, Label, Select } from '@viamrobotics/prime-core'
	import { CameraClient, type RobotClient, streamApi, StreamClient } from '@viamrobotics/sdk'
	import { useRobotClient } from '@viamrobotics/svelte-sdk'
	import { useResizeObserver } from 'runed'
	import { untrack } from 'svelte'

	import { assertExists } from '$lib/assert'
	import ContentRect from '$lib/components/content-rect.svelte'
	import ErrorDisplay from '$lib/components/error.svelte'
	import MutationSection from '$lib/components/mutation-section.svelte'
	import Progress from '$lib/components/progress.svelte'
	import { formatNumeric } from '$lib/format'
	import { useMeasureFps } from '$lib/fps.svelte'
	import { usePip } from '$lib/pip/context.svelte'

	import { getBlobForViamDepth, VIAM_DEPTH_MIME_TYPE } from './decode-viam-depth'
	import { pickImageForSource } from './pick-image-for-source'

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
	}: Props = $props()

	let videoElement = $state.raw<HTMLVideoElement>()
	let isStreamLoading = $state(false)
	let streamError: Error | null
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
	let resolutionOptions = $state<streamApi.Resolution[]>([])
	let selectedResolution: streamApi.Resolution | undefined

	const disableStream = async () => {
		try {
			isStreamLoading = false
			streamError = null
			const last = streamClient
			streamClient = undefined
			last?.off('track', handleTrack)
			await last?.remove(resourceName)
			resolutionOptions = []
			selectedResolution = undefined
			liveStreamStart = undefined
		} catch (nextError: unknown) {
			lastError = nextError as Error
		}
	}

	const handleResolutionChange = (event: Event) => {
		if (event.target instanceof HTMLSelectElement) {
			const [width, height] = event.target.value.split('x').map(Number) as [number, number]
			selectedResolution = new streamApi.Resolution({ width, height })
		}
	}

	// NOTE(ELP): I don't know that this will be used anywhere else, so I'm
	// opting to leave it here for now. This could be moved to a shared
	// createMutation function.
	const mutationOptions = $derived({
		mutationKey: [partID, resourceName, 'setOptions'],
		mutationFn: async (resolution?: streamApi.Resolution) => {
			assertExists(streamClient, 'Expected stream client')
			if (resolution) {
				return streamClient.setOptions(resourceName, resolution.width, resolution.height)
			}
			return streamClient.resetOptions(resourceName)
		},
	})

	const resolutionMutation = createMutation(() => mutationOptions)

	const startStream = async (robotClient: RobotClient, name: string, live: boolean) => {
		try {
			await disableStream()
			// Don't setMediaStream(null) here or else the PiP thrashes.

			if (live) {
				// Live streams

				isStreamLoading = true
				liveStreamStart = performance.now()
				streamClient = new StreamClient(robotClient)
				streamClient.on('track', handleTrack)
				await streamClient.getStream(name)
				resolutionOptions = await streamClient.getOptions(name)
				selectedResolution = resolutionOptions[0]
			} else {
				// Polling

				// Trigger a refetch on initial change.
				await refetch()

				setMediaStream(canvas.captureStream())
			}
		} catch (nextError) {
			streamError = nextError as Error
		}
	}

	$effect(() => {
		if (client.current && !lastError) {
			void startStream(client.current, resourceName, isLive)
		}
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

	$effect(() => {
		if (lastError) {
			disableStream()
				.then(() => {
					setMediaStream(null)
				})
				.catch((nextError: unknown) => {
					lastError = nextError as Error
				})
		}
	})

	$effect(() => {
		img.addEventListener('load', drawImage)

		return () => {
			img.removeEventListener('load', drawImage)
		}
	})

	$effect(() => {
		const matchingImage = pickImageForSource(data?.images, sourceName)
		if (!matchingImage?.image) {
			return
		}

		const bytes = new Uint8Array(matchingImage.image)
		let cancelled = false
		let objectUrl: string | undefined

		const render = async () => {
			let blob: Blob | undefined
			if (matchingImage.mimeType === VIAM_DEPTH_MIME_TYPE) {
				blob = await getBlobForViamDepth(bytes)
				if (!blob) {
					lastError = new Error('Failed to decode depth frame: truncated or corrupt buffer')
					return
				}
			} else {
				blob = new Blob([bytes], { type: matchingImage.mimeType || 'image/jpeg' })
			}
			if (cancelled) return
			lastError = undefined
			objectUrl = URL.createObjectURL(blob)
			img.src = objectUrl
		}

		void render()

		return () => {
			cancelled = true
			if (objectUrl) URL.revokeObjectURL(objectUrl)
		}
	})

	let contentRect = $state.raw<DOMRect>()
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
		const dx = event.pageX - (rect.x ?? 0)
		const dy = event.pageY - (rect.y ?? 0)

		let pctX = dx / (rect.width ?? 1)
		let pctY = dy / (rect.height ?? 1)

		pctX = Math.min(Math.max(pctX, 0), 1)
		pctY = Math.min(Math.max(pctY, 0), 1)

		let absX = 0
		let absY = 0

		if (isLive && selectedResolution) {
			absX = pctX * selectedResolution.width
			absY = pctY * selectedResolution.height
		} else {
			absX = pctX * canvas.width
			absY = pctY * canvas.height
		}
		mouseHoverImagePosition = { pctX, pctY, absX, absY }
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

		const measure = (now: DOMHighResTimeStamp) => {
			fps.measure(now)
			id = videoElement?.requestVideoFrameCallback?.(measure)
		}

		id = videoElement?.requestVideoFrameCallback?.(measure)
		return () => id && videoElement?.cancelVideoFrameCallback(id)
	})

	// Errors are null during loading, so keep the latest errors during polling.
	let lastError = $state.raw<Error>()
	$effect(() => {
		if (!isLive && error) {
			lastError = error
		} else if (isLive && streamError) {
			lastError = streamError
		} else {
			lastError = undefined
		}
	})
</script>

<!-- This breaks out of using the <Query> component
  to merge live stream and TanStack query errors -->
{#if lastError}
	<ContentRect
		{contentRect}
		cx="bg-medium/50 absolute flex h-64 w-80 items-center justify-center"
	>
		<ErrorDisplay
			class="pb-4"
			{lastError}
		/>
	</ContentRect>
{:else if isLive ? isStreamLoading : isLoading}
	<ContentRect
		{contentRect}
		cx="absolute h-64 w-80"
	>
		<Progress />
	</ContentRect>
{/if}

<div class="relative">
	<div
		class="absolute bottom-2 left-2 z-10 rounded-[3px] bg-black/30 px-1 py-0.5 text-right font-mono text-xs text-white"
	>
		{fps.current.toFixed(1)}fps
	</div>
	<video
		bind:this={videoElement}
		class={videoClass}
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

{#if showResolutionOptions && isLive}
	<MutationSection
		title="SetStreamOptions"
		api="rdk:component:camera"
		description="Change the resolution of the live stream video feed"
		lastError={resolutionMutation.error}
		class="-m-4 mt-4"
	>
		<div class="flex w-full flex-row justify-between">
			<Label cx="max-w-[96px] gap-1 text-xs">
				<span class="flex gap-1 whitespace-nowrap">
					Resolution
					<abbr class="text-disabled">(width x height)</abbr>
				</span>
				<Select
					slot="input"
					on:change={handleResolutionChange}
				>
					{#each resolutionOptions as { width, height } (`${width}x${height}`)}
						<option>
							{width}x{height}
						</option>
					{/each}
					{#if resolutionOptions.length === 0}
						<option disabled>Camera did not return resolution options</option>
					{/if}
				</Select>
			</Label>
			<div class="flex flex-row items-end gap-2">
				<Button
					onclick={() => {
						resolutionMutation.mutate(undefined)
					}}
				>
					Reset
				</Button>
				<Button
					icon="play-circle-outline"
					variant="dark"
					disabled={resolutionOptions.length === 0}
					onclick={() => {
						if (selectedResolution) {
							resolutionMutation.mutate(selectedResolution)
						}
					}}
				>
					Execute
				</Button>
			</div>
		</div>
	</MutationSection>
{/if}
