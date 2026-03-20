<script lang="ts">
	import { labelToColor } from '../vision-service-view/color';
	import { getBoundingRect, getModifyKeyForOS } from './annotation-edit-utils';
	import type { BoundingBox, Coordinates, ResizeHandleLocation } from './bounding-box-types';
	import ResizeHandles from './resize-handles.svelte';

	// opacity represented as hexadecimal
	const ACTIVE_BG_OPACITY = '70';
	const INACTIVE_BG_OPACITY = '30';
	const ACTIVE_BORDER_OPACITY = 'FF';
	const INACTIVE_BORDER_OPACITY = 'AA';

	const MODIFY_KEY = getModifyKeyForOS();

	interface Props {
		/** whether to display the active (hovered) state */
		active: boolean;
		/** which corner is currently being manipulated */
		activeResizeHandle?: ResizeHandleLocation | undefined;
		/** whether to allow click or hovering behaviors to function */
		allowInteractivity: boolean;
		/** bounding box size and label information */
		annotation: BoundingBox;
		/** width of drawing container */
		containerHeight: number;
		/** height of drawing container */
		containerWidth: number;
		/** distance box has been dragged in pixels */
		dragDistance?: Coordinates;
		/** whether box should be displayed with dashed borders to indicate pending status */
		isPending: boolean;
		/** whether box should box should be editable (can still be hovered) */
		readonly?: boolean;
		/** whether box has been selected (clicked on) */
		selected?: boolean;
		/** tab index used for tabbing behaviors */
		tabIndex?: number;
		/** current zoom scale being applied to labeller */
		zoom: number;
		/** add current box to list of hovered boxes */
		addToHovered?: (id: string) => void;
		/** called when backspace keyboard key is pressed */
		onBackspacePress?: (id: string, label: string) => void;
		/** called when hitting copy command */
		onCopyPress?: () => void;
		/** called when enter keyboard key is pressed */
		onEnterPress?: (id: string) => void;
		/** called when escape keyboard key is pressed */
		onEscapePress?: VoidFunction;
		/** called on mouse down on the box */
		onMouseDown?: (event: MouseEvent, id: string, corner?: ResizeHandleLocation) => void;
		/** remove current box to list of hovered boxes */
		removeFromHovered?: (id: string) => void;
	}

	const {
		active,
		activeResizeHandle,
		allowInteractivity,
		annotation,
		containerHeight,
		containerWidth,
		dragDistance,
		isPending,
		readonly = false,
		selected = false,
		tabIndex = -1,
		zoom,
		addToHovered,
		onBackspacePress,
		onCopyPress,
		onEnterPress,
		onEscapePress,
		onMouseDown,
		removeFromHovered
	}: Props = $props();

	const color = $derived(labelToColor(annotation.label));

	let factoredXMin = $state(0);
	let factoredXMax = $state(0);
	let factoredYMin = $state(0);
	let factoredYMax = $state(0);
	let box: HTMLDivElement | undefined = $state();
	let labelText: HTMLDivElement | undefined = $state();

	const drag = $derived(selected ? dragDistance : undefined);

	$effect.pre(() => {
		const boundingRect = getBoundingRect(
			annotation,
			drag,
			containerWidth,
			containerHeight,
			activeResizeHandle
		);

		factoredXMin = boundingRect.xMinNormalized;
		factoredXMax = boundingRect.xMaxNormalized;
		factoredYMin = boundingRect.yMinNormalized;
		factoredYMax = boundingRect.yMaxNormalized;
	});

	const showHighlight = $derived(active || selected);

	const handleMove = () => {
		if (allowInteractivity) {
			addToHovered?.(annotation.id);
		}
	};

	const handleLeave = () => {
		removeFromHovered?.(annotation.id);
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		if (selected && event[MODIFY_KEY]) {
			// prevents UX from going into crosshair drawing mode when first pressing CMD/CTRL key
			event.stopPropagation();

			if (event.code === 'KeyC') {
				onCopyPress?.();
				box?.blur();
			}
		}

		switch (event.code) {
			case 'Escape': {
				event.stopPropagation();
				onEscapePress?.();
				break;
			}
			case 'Enter': {
				event.stopPropagation();
				onEnterPress?.(annotation.id);
				break;
			}
			case 'Backspace': {
				event.stopPropagation();
				onBackspacePress?.(annotation.id, annotation.label);
				break;
			}
		}
	};

	$effect(() => {
		if (selected) {
			box?.focus();
		} else {
			box?.blur();
		}
	});

	const handleMouseDown = (event: MouseEvent) => {
		if (!readonly && allowInteractivity) {
			event.stopPropagation();
			onMouseDown?.(event, annotation.id);
		}
	};

	const handleCornerPointerDown = (event: MouseEvent, corner: ResizeHandleLocation) => {
		event.stopPropagation();
		onMouseDown?.(event, annotation.id, corner);
	};

	const zIndex = $derived.by(() => {
		if (selected) return 30;
		if (showHighlight) return 20;
		return 10;
	});

	const labelTextWidth = $derived(labelText?.getBoundingClientRect().width ?? 0);
	const rightAlignText = $derived.by(() => {
		// check if text needs right align when text is bigger than box
		if (labelTextWidth < (factoredXMax - factoredXMin) * zoom) {
			return false;
		}

		// only right align when the distance between the box left edge plus text width exceeds container boundary
		return labelTextWidth / zoom + factoredXMin > containerWidth;
	});
</script>

<div
	role="button"
	tabindex={tabIndex}
	bind:this={box}
	class={['absolute outline-none', { 'border-dashed': isPending }]}
	style:border-width={`${2 / zoom}px`}
	style:border-color={showHighlight
		? `${color}${ACTIVE_BORDER_OPACITY.toString()}`
		: `${color}${INACTIVE_BORDER_OPACITY.toString()}`}
	style:background-color={showHighlight
		? `${color}${ACTIVE_BG_OPACITY.toString()}`
		: `${color}${INACTIVE_BG_OPACITY.toString()}`}
	style:top={`${factoredYMin}px`}
	style:left={`${factoredXMin}px`}
	style:height={`${factoredYMax - factoredYMin}px`}
	style:width={`${factoredXMax - factoredXMin}px`}
	style:z-index={zIndex}
	onmousedown={handleMouseDown}
	onmouseleave={handleLeave}
	onmousemove={handleMove}
	onkeydown={handleKeyDown}
>
	{#if showHighlight}
		<div
			bind:this={labelText}
			class="absolute w-fit select-none"
			style:background-color={color}
			style:transform-origin={`top ${rightAlignText ? 'right' : 'left'}`}
			style:scale={1 / zoom}
			style:right={rightAlignText ? `-${2 / zoom}px` : undefined}
			style:left={rightAlignText ? undefined : `-${2 / zoom}px`}
			style:top={factoredYMin > 24 / zoom ? `-${24 / zoom}px` : `-${2 / zoom}px`}
		>
			<span class="font-roboto-mono px-2 py-0.5 text-xs font-medium whitespace-nowrap"
				>{annotation.label}</span
			>
		</div>
	{/if}
	{#if selected && !readonly}
		<ResizeHandles
			{zoom}
			onMouseDown={handleCornerPointerDown}
		/>
	{/if}
</div>
