<script lang="ts">
	import { ResizeHandleLocation } from './bounding-box-types';
	import ResizeCorner from './resize-corner.svelte';
	import ResizeEdge from './resize-edge.svelte';

	interface Props {
		zoom: number;
		onMouseDown: (event: MouseEvent, edge: ResizeHandleLocation) => void;
	}

	const { zoom, onMouseDown }: Props = $props();
</script>

<ResizeEdge
	{zoom}
	edgeDesignation={ResizeHandleLocation.T}
	{onMouseDown}
/>
<ResizeEdge
	{zoom}
	edgeDesignation={ResizeHandleLocation.R}
	{onMouseDown}
/>
<ResizeEdge
	{zoom}
	edgeDesignation={ResizeHandleLocation.B}
	{onMouseDown}
/>
<ResizeEdge
	{zoom}
	edgeDesignation={ResizeHandleLocation.L}
	{onMouseDown}
/>
<ResizeCorner
	{zoom}
	cornerDesignation={ResizeHandleLocation.TL}
	{onMouseDown}
/>
<ResizeCorner
	{zoom}
	cornerDesignation={ResizeHandleLocation.TR}
	{onMouseDown}
/>
<ResizeCorner
	{zoom}
	cornerDesignation={ResizeHandleLocation.BL}
	{onMouseDown}
/>
<ResizeCorner
	{zoom}
	cornerDesignation={ResizeHandleLocation.BR}
	{onMouseDown}
/>
