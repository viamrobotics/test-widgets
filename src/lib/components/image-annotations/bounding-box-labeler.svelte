<script lang="ts">
	import { resize } from '@svelte-put/resize'
	import { clickOutside, Progress } from '@viamrobotics/prime-core'
	import { onMount, untrack } from 'svelte'

	import { getImageSize } from '$lib/components/widgets/vision-service/get-image-size'

	import type {
		BoundingBox as BoundingBoxData,
		BoundingCoords,
		Coordinates,
		ResizeHandleLocation,
	} from './bounding-box-types'

	import {
		calculatePastedBox,
		createNormalizedTempBox,
		getBoundingRect,
		getModifyKeyForOS,
	} from './annotation-edit-utils'
	import BoundingBox from './bounding-box.svelte'
	import { getImageSize as getImageSizeDynamic, type Size } from './get-image-size'
	import {
		INVERT_X_FLOAT_DISTANCE,
		INVERT_Y_FLOAT_DISTANCE,
		ZOOM_MAX,
		ZOOM_MIN,
	} from './labeler-constants'
	import { ResizeHandleClassMap } from './resize-handle-props'

	const MODIFY_KEY = getModifyKeyForOS()

	interface Props {
		/** whether to allow drawing of new bounding boxes */
		allowDrawing: boolean
		/** inference candidates displayed using readonly bounding boxes */
		candidateBoundingBoxes?: BoundingBoxData[]
		/** currently selected box */
		editTarget?: BoundingBoxData | undefined
		/** map of annotations displayed in their hovered states */
		hoveredAnnotations: Record<string, boolean>
		/** whether image is loading */
		imageLoading: boolean
		/** URI of image */
		imageSrc: string
		/** used to set the max size of the display container, used for bounding boxes */
		maxSize?: { maxHeight: number; maxWidth: number }
		/** whether to allow any interactivity (i.e. drawing, editing, deleting) */
		readonly?: boolean
		/** bounding boxes saved on the image */
		savedBoundingBoxes: BoundingBoxData[]
		/** user selected label to apply to drawn boxes */
		selectedLabel?: string
		/** whether to display candidates and saved boxes or just candidates */
		showSavedBoundingBoxes?: boolean
		/** how much image is zoomed */
		zoom?: number
		/** accept the selected inference candidate box */
		acceptCandidate?: (id: string) => void
		/** saves drawn bounding box to image */
		createBoundingBox?: (newBox: BoundingBoxData) => void
		/** deletes saved bounding box */
		deleteBoundingBox?: (annotationID: string, targetLabel: string) => void
		/** save changes to existing box */
		editBoundingBox?: (id: string, newBox: BoundingBoxData) => void
		/** invoked when displayed image loaded */
		onImageLoad?: VoidFunction
		/** reject the selected inference candidate box */
		rejectCandidate?: (id: string) => void
		/** set which box is being edited */
		setEditTarget?: (target: BoundingBoxData | undefined) => void
		/** used to change which boxes are hovered  */
		setHoveredAnnotations?: (newHovered: Record<string, boolean>) => void
		/** sets zoom */
		setZoom?: (value: number) => void
	}

	const {
		allowDrawing,
		candidateBoundingBoxes,
		editTarget,
		hoveredAnnotations,
		imageLoading,
		imageSrc,
		maxSize,
		readonly = false,
		savedBoundingBoxes,
		selectedLabel,
		showSavedBoundingBoxes = true,
		zoom = 1,
		acceptCandidate,
		createBoundingBox,
		deleteBoundingBox,
		editBoundingBox,
		onImageLoad,
		rejectCandidate,
		setEditTarget,
		setHoveredAnnotations,
		setZoom,
	}: Props = $props()

	let dataURI = $state<string>()
	const img = $state(document.createElement('img'))
	let container = $state<HTMLElement>()
	let size = $state<Size>()
	let firstClickedPoint = $state<Coordinates>()
	let normalizedDrawnBox = $state<BoundingBoxData>()
	let drawingContainer = $state<HTMLDivElement>()
	let floatingCoords = $state<HTMLDivElement>()
	let currentMousePosition = $state<Coordinates>({ x: 0, y: 0 })
	let activeResizeHandle = $state<ResizeHandleLocation>()
	let inEditMode = $state(false)
	let showMouseCoords = $state(false)
	let copiedBox = $state<BoundingBoxData>()
	let allowPaste = $state(true)

	const dragDistance = $derived(
		firstClickedPoint
			? {
					x: currentMousePosition.x - firstClickedPoint.x,
					y: currentMousePosition.y - firstClickedPoint.y,
				}
			: undefined
	)

	const getOffset = (el: HTMLElement | undefined) => {
		if (el) {
			const { height, width } = el.getBoundingClientRect()
			return { x: width, y: height }
		}
		return undefined
	}

	let zoomOffset = $derived(getOffset(drawingContainer))

	const setSize = () => {
		if (maxSize) {
			size = getImageSize(img, maxSize)
		} else if (container) {
			size = getImageSizeDynamic(img, container)
		}

		if (drawingContainer) {
			zoomOffset = getOffset(drawingContainer)
			drawingContainer?.scrollIntoView()
		}
	}

	const backgroundImageLoad = () => {
		setSize()

		// gets image binary from img element
		const cvs = document.createElement('canvas')
		cvs.width = img.width
		cvs.height = img.height
		cvs.getContext('2d')?.drawImage(img, 0, 0)
		dataURI = cvs.toDataURL()
	}

	const resetDrawing = (clearTarget: boolean | undefined = true) => {
		if (clearTarget) {
			setEditTarget?.(undefined)
		}
		firstClickedPoint = undefined
		normalizedDrawnBox = undefined
		activeResizeHandle = undefined
		inEditMode = false
	}

	onMount(() => {
		img.addEventListener('load', backgroundImageLoad)
		globalThis.addEventListener('mousemove', handleOverlayMove)
		globalThis.addEventListener('mouseup', handleMouseUp)
		globalThis.addEventListener('keydown', handleKeyDown)
		return () => {
			img.removeEventListener('load', backgroundImageLoad)
			globalThis.removeEventListener('mouseup', handleMouseUp)
			globalThis.removeEventListener('keydown', handleKeyDown)
			globalThis.removeEventListener('mousemove', handleOverlayMove)
		}
	})

	$effect.pre(() => {
		if (imageSrc) {
			img.src = imageSrc
		}
		img.crossOrigin = 'anonymous'
	})

	$effect.pre(() => {
		void container
		setSize()
	})

	$effect.pre(() => {
		if (allowDrawing) {
			setHoveredAnnotations?.({})
		} else {
			resetDrawing()
		}
	})

	const getRelativeMousePosition = (event: MouseEvent): Coordinates => {
		if (drawingContainer) {
			const boundingRect = drawingContainer.getBoundingClientRect()
			const { clientX, clientY } = event

			const { left, top } = boundingRect
			const x = (clientX - left) / zoom
			const y = (clientY - top) / zoom

			return { x, y }
		}

		return { x: 0, y: 0 }
	}

	const sendEditAnnotationRequest = (annotation: BoundingBoxData) => {
		editBoundingBox?.(annotation.id, annotation)
	}

	const findAndSetTarget = (id: string | undefined) => {
		setEditTarget?.(savedBoundingBoxes.find((ann) => ann.id === id))
	}

	const handleMouseDown = (event: MouseEvent) => {
		if (readonly) {
			return
		}

		if (editTarget) {
			setEditTarget?.(undefined)
		} else if (allowDrawing) {
			firstClickedPoint = getRelativeMousePosition(event)
		}
	}

	const handleMouseUp = () => {
		if (readonly) {
			return
		}

		if (editTarget && inEditMode && size) {
			if (dragDistance) {
				// in edit mode
				const boundingRect = getBoundingRect(
					editTarget,
					dragDistance,
					size.width,
					size.height,
					activeResizeHandle
				)

				const normalized: BoundingCoords = {
					xMinNormalized: boundingRect.xMinNormalized / size.width,
					xMaxNormalized: boundingRect.xMaxNormalized / size.width,
					yMinNormalized: boundingRect.yMinNormalized / size.height,
					yMaxNormalized: boundingRect.yMaxNormalized / size.height,
				}

				const editedBox = {
					...editTarget,
					...normalized,
				}

				resetDrawing(false)
				sendEditAnnotationRequest(editedBox)
			} else {
				resetDrawing(false)
			}
		} else {
			// in create mode
			if (normalizedDrawnBox) {
				createBoundingBox?.(normalizedDrawnBox)
			}
			resetDrawing(true)
		}
	}

	// show coordinates and allow paste only when over image
	const handleMove = () => {
		if (readonly) {
			return
		}

		showMouseCoords = true
		allowPaste = true
	}

	// track mouse movement over entire screen
	const handleOverlayMove = (event: MouseEvent) => {
		const coords = getRelativeMousePosition(event)

		currentMousePosition = coords

		if (firstClickedPoint && size && !editTarget) {
			// prevent mouse from highlighting when dragging over text outside of image, but only if a point on the image has been clicked first
			event.preventDefault()
			normalizedDrawnBox = createNormalizedTempBox(
				selectedLabel ?? '',
				size,
				firstClickedPoint,
				coords
			)
		}
	}

	const onMouseDownAnnotation = (
		event: MouseEvent,
		annotationID: string,
		corner?: ResizeHandleLocation
	) => {
		event.preventDefault()
		if (readonly) {
			return
		}

		if (annotationID !== editTarget?.id) {
			findAndSetTarget(annotationID)
		}
		inEditMode = true
		firstClickedPoint = getRelativeMousePosition(event)
		activeResizeHandle = corner
	}

	// sorting by distance from top so that index can represent a top-to-bottom tab order
	const sortedCandidatesByTop = $derived(
		candidateBoundingBoxes
			? candidateBoundingBoxes.toSorted((boxA, boxB) => boxA.yMinNormalized - boxB.yMinNormalized)
			: []
	)

	const addToHovered = (id: string) => {
		setHoveredAnnotations?.({ ...hoveredAnnotations, [id]: true })
	}

	const removeFromHovered = (id: string) => {
		setHoveredAnnotations?.({ ...hoveredAnnotations, [id]: false })
	}

	const handleWheel = (event: WheelEvent) => {
		if (event.metaKey && zoom <= ZOOM_MAX && zoom >= ZOOM_MIN) {
			showMouseCoords = false
			const { deltaY } = event
			event.preventDefault()
			const newZoom = zoom + deltaY / 100

			if (newZoom > ZOOM_MAX) {
				setZoom?.(ZOOM_MAX)
				return
			}

			if (newZoom < ZOOM_MIN) {
				setZoom?.(ZOOM_MIN)
				return
			}

			setZoom?.(newZoom)
		}
	}

	$effect(() => {
		void zoom
		untrack(() => {
			container?.scrollTo({
				left: currentMousePosition.x * (zoom - 1),
				top: currentMousePosition.y * (zoom - 1),
				behavior: 'instant',
			})
		})
	})

	const handleLeave = () => {
		showMouseCoords = false
		allowPaste = false
	}

	const handleKeyDown = (event: KeyboardEvent) => {
		if (event[MODIFY_KEY] && event.code === 'KeyV' && size && copiedBox && allowPaste) {
			const pastedBox = calculatePastedBox(currentMousePosition, copiedBox, size.width, size.height)

			createBoundingBox?.(pastedBox)
		}
	}

	const copyBoundingBox = () => {
		copiedBox = editTarget
	}

	const floatingHeight = $derived(floatingCoords?.getBoundingClientRect().height ?? 0)
</script>

<div
	class={[
		'flex h-full min-h-0 w-full min-w-0 grow flex-col items-center justify-center',
		{ 'overflow-x-auto overflow-y-auto': !maxSize },
	]}
	bind:this={container}
	use:resize
	onwheel={handleWheel}
	onresized={setSize}
	style:cursor={activeResizeHandle ? ResizeHandleClassMap[activeResizeHandle].cursor : undefined}
>
	{#if size && dataURI}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="relative h-fit w-fit"
			style:left={zoom > 1 && zoomOffset ? `${(zoomOffset.x * (zoom - 1)) / 2}px` : ''}
			style:top={zoom > 1 && zoomOffset ? `${(zoomOffset.y * (zoom - 1)) / 2}px` : ''}
			bind:this={drawingContainer}
			onmousedown={handleMouseDown}
			onmousemove={handleMove}
			onmouseleave={handleLeave}
			use:clickOutside={() => resetDrawing()}
			style:scale={zoom}
		>
			<div
				bind:this={floatingCoords}
				class={[
					'z-max absolute origin-bottom-left rounded-md bg-black px-1.5',
					{
						hidden: !showMouseCoords,
						'origin-bottom-left': currentMousePosition.y > INVERT_Y_FLOAT_DISTANCE / zoom,
						'origin-top-left': currentMousePosition.y <= INVERT_Y_FLOAT_DISTANCE / zoom,
					},
				]}
				style:left={`${currentMousePosition.x + (size.width - currentMousePosition.x < INVERT_X_FLOAT_DISTANCE / zoom ? -95 : 4) / zoom}px`}
				style:top={`${currentMousePosition.y + (currentMousePosition.y > INVERT_Y_FLOAT_DISTANCE / zoom ? -1 * (floatingHeight + 5 / zoom) : 5 / zoom)}px`}
				style:scale={1 / zoom}
			>
				<span class="font-roboto-mono text-xs whitespace-nowrap text-white"
					>{`{${Math.round(currentMousePosition.x)},${Math.round(currentMousePosition.y)}}`}</span
				>
			</div>
			<img
				class={['z-0 select-none', { invisible: imageLoading }]}
				height={size.height}
				width={size.width}
				src={dataURI}
				alt={imageSrc}
				crossorigin="anonymous"
				onload={onImageLoad}
			/>
			{#if imageLoading}
				<div class="absolute top-0 flex h-full w-full items-center justify-center">
					<Progress size="large" />
				</div>
			{:else}
				<div
					style={`height: ${size.height}px; width: ${size.width}px;`}
					class="absolute top-0 z-10 overflow-hidden"
				>
					{#if normalizedDrawnBox}
						<BoundingBox
							active={true}
							annotation={normalizedDrawnBox}
							allowInteractivity={false}
							containerHeight={size.height}
							containerWidth={size.width}
							readonly={true}
							selected={false}
							isPending={false}
							{zoom}
							onEscapePress={resetDrawing}
						/>
					{/if}
					{#each sortedCandidatesByTop as candidate, index (candidate.id)}
						<BoundingBox
							active={Boolean(hoveredAnnotations[candidate.id])}
							allowInteractivity={true}
							annotation={candidate}
							containerHeight={size.height}
							containerWidth={size.width}
							{dragDistance}
							isPending={true}
							{readonly}
							tabIndex={index + 1}
							{zoom}
							{addToHovered}
							onEscapePress={resetDrawing}
							onBackspacePress={rejectCandidate}
							onEnterPress={acceptCandidate}
							{removeFromHovered}
						/>
					{/each}
					{#if showSavedBoundingBoxes}
						{#each savedBoundingBoxes as boundingBox, index (boundingBox.id)}
							<BoundingBox
								active={Boolean(hoveredAnnotations[boundingBox.id])}
								{activeResizeHandle}
								allowInteractivity={!allowDrawing}
								annotation={boundingBox}
								containerHeight={size.height}
								containerWidth={size.width}
								{dragDistance}
								isPending={false}
								{readonly}
								selected={editTarget?.id === boundingBox.id}
								tabIndex={index + 1}
								{zoom}
								{addToHovered}
								onBackspacePress={deleteBoundingBox}
								onCopyPress={copyBoundingBox}
								onEscapePress={resetDrawing}
								onMouseDown={onMouseDownAnnotation}
								{removeFromHovered}
							/>
						{/each}
					{/if}
				</div>
			{/if}
		</div>
	{:else}
		<div
			class="flex w-full items-center justify-center"
			style:height={maxSize?.maxHeight ? `${maxSize?.maxHeight}px` : '250px'}
		>
			<Progress size="large" />
		</div>
	{/if}
</div>
