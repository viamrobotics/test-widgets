<script lang="ts">
	import type { Detection } from '@viamrobotics/sdk'

	import { labelToColor, lightTextColors } from './color'

	interface Props {
		/** The image file, drawn at full width and its own ratio. */
		file: File
		/** The image's natural size in pixels, the space the detection boxes are in. */
		width: number
		height: number
		detections: Detection[]
		alt: string
	}

	const { file, width, height, detections, alt }: Props = $props()

	const PERCENT = 100

	const url = $derived(URL.createObjectURL(file))

	$effect(() => {
		const current = url
		return () => URL.revokeObjectURL(current)
	})

	interface Box {
		key: string
		className: string
		color: string
		textColor: string
		left: string
		top: string
		width: string
		height: string
	}

	const toPercent = (value: number, of: number) => `${((value / of) * PERCENT).toString()}%`

	const textColorFor = (color: string) => (lightTextColors.includes(color) ? 'white' : 'black')

	// Percentages of the natural size scale each box with the displayed image.
	const toBox = (detection: Detection, index: number): Box | undefined => {
		const { xMin, yMin, xMax, yMax, className } = detection
		if (xMin === undefined || yMin === undefined || xMax === undefined || yMax === undefined) {
			return undefined
		}
		const color = labelToColor(className)
		return {
			key: `${index.toString()}:${className}`,
			className,
			color,
			textColor: textColorFor(color),
			left: toPercent(Number(xMin), width),
			top: toPercent(Number(yMin), height),
			width: toPercent(Number(xMax - xMin), width),
			height: toPercent(Number(yMax - yMin), height),
		}
	}

	const boxes = $derived(
		detections
			.map((detection, index) => toBox(detection, index))
			.filter((box): box is Box => box !== undefined)
	)
</script>

<div class="relative w-full overflow-hidden">
	<img
		src={url}
		{alt}
		{width}
		{height}
		class="block h-auto w-full"
	/>
	{#each boxes as box (box.key)}
		<div
			data-testid="detection-box"
			aria-hidden="true"
			class="absolute box-border border-2"
			style:left={box.left}
			style:top={box.top}
			style:width={box.width}
			style:height={box.height}
			style:border-color={box.color}
		>
			<span
				class="absolute top-0 left-0 px-1 text-xs"
				style:background-color={box.color}
				style:color={box.textColor}
			>
				{box.className}
			</span>
		</div>
	{/each}
</div>
