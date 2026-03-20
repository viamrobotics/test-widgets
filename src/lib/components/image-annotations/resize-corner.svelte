<script lang="ts">
	import { ResizeHandleLocation } from './bounding-box-types'
	import {
		BOX_SIZE,
		INVISIBLE_BUFFER,
		ResizeHandleClassMap,
		WRAPPER_SIZE,
	} from './resize-handle-props'

	interface Props {
		cornerDesignation: ResizeHandleLocation
		zoom?: number
		onMouseDown: (event: MouseEvent, corner: ResizeHandleLocation) => void
	}

	const { cornerDesignation, zoom = 1, onMouseDown }: Props = $props()

	const wrapperStyle = $derived(ResizeHandleClassMap[cornerDesignation])

	const handleMouseDown = (event: MouseEvent) => {
		;(event as PointerEvent).stopPropagation()
		onMouseDown(event, cornerDesignation)
	}
</script>

<button
	tabindex="-1"
	class="absolute"
	aria-label={`${cornerDesignation}-resize`}
	style:height={`${WRAPPER_SIZE}px`}
	style:width={`${WRAPPER_SIZE}px`}
	style:left={`${wrapperStyle.positionLeft ?? ''}px`}
	style:top={`${wrapperStyle.positionTop ?? ''}px`}
	style:right={`${wrapperStyle.positionRight ?? ''}px`}
	style:bottom={`${wrapperStyle.positionBottom ?? ''}px`}
	style:cursor={wrapperStyle.cursor}
	style:scale={1 / zoom}
	onmousedown={handleMouseDown}
>
	<div
		style:height={`${BOX_SIZE}px`}
		style:width={`${BOX_SIZE}px`}
		style:left={`${INVISIBLE_BUFFER / 2}px`}
		style:top={`${INVISIBLE_BUFFER / 2}px`}
		class="absolute border border-black bg-white"
	></div>
</button>
