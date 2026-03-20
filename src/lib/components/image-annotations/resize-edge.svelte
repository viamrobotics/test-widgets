<script lang="ts">
	import { ResizeHandleLocation } from './bounding-box-types';
	import { ResizeHandleClassMap } from './resize-handle-props';

	interface Props {
		edgeDesignation: ResizeHandleLocation;
		zoom?: number;
		onMouseDown: (event: MouseEvent, edge: ResizeHandleLocation) => void;
	}

	const { edgeDesignation, zoom = 1, onMouseDown }: Props = $props();

	const wrapperStyle = $derived(ResizeHandleClassMap[edgeDesignation]);

	const handleMouseDown = (event: MouseEvent) => {
		(event as PointerEvent).stopPropagation();
		onMouseDown(event, edgeDesignation);
	};

	const scale = $derived.by(() => {
		switch (edgeDesignation) {
			case ResizeHandleLocation.L:
			case ResizeHandleLocation.R: {
				return `${1 / zoom} 1`;
			}
			case ResizeHandleLocation.T:
			case ResizeHandleLocation.B: {
				return `1 ${1 / zoom}`;
			}
			default: {
				return '';
			}
		}
	});
</script>

<button
	tabindex="-1"
	class="absolute"
	aria-label={`${edgeDesignation}-resize`}
	style:height={wrapperStyle.height}
	style:width={wrapperStyle.width}
	style:left={`${wrapperStyle.positionLeft ?? ''}px`}
	style:top={`${wrapperStyle.positionTop ?? ''}px`}
	style:right={`${wrapperStyle.positionRight ?? ''}px`}
	style:bottom={`${wrapperStyle.positionBottom ?? ''}px`}
	style:cursor={wrapperStyle.cursor}
	style:scale
	onmousedown={handleMouseDown}
>
</button>
