<script lang="ts">
	import { useThrelte } from '@threlte/core'
	import { useInteractivity } from '@threlte/extras'
	import { onMount } from 'svelte'
	import { Vector2 } from 'three'
	import { Container, Text } from 'threlte-uikit'

	import { lightTextColors } from './color'
	import { type Detection, useDetections } from './context.svelte'

	const { size } = useThrelte()

	interface Props {
		detection: Detection
		factor?: number
	}

	const { detection, factor = 0 }: Props = $props()

	const normalizedDeviceCoordsToPixel = (
		ndcCoords: Vector2,
		canvasWidth: number,
		canvasHeight: number
	) => {
		const screenX = (ndcCoords.x + 1) / 2
		const screenY = (ndcCoords.y + 1) / 2
		const pixelX = Math.round(screenX * canvasWidth)
		const pixelY = Math.round((1 - screenY) * canvasHeight)
		return new Vector2(pixelX, pixelY)
	}

	const { pointer } = useInteractivity()
	const context = useDetections()

	const factoredxMin = $derived(Number(detection.xMin) * factor)
	const factoredxMax = $derived(Number(detection.xMax) * factor)
	const factoredyMin = $derived(Number(detection.yMin) * factor)
	const factoredyMax = $derived(Number(detection.yMax) * factor)

	/**
	 * Check preexisting mouse coords for hover state
	 */
	$effect.pre(() => {
		const pixelCoords = normalizedDeviceCoordsToPixel($pointer, $size.width, $size.height)

		if (
			factoredxMin < pixelCoords.x &&
			factoredxMax > pixelCoords.x &&
			factoredyMin < pixelCoords.y &&
			factoredyMax > pixelCoords.y
		) {
			context.hovered.add(detection.id)
		} else {
			context.hovered.delete(detection.id)
		}
	})

	const hovering = $derived(context.hovered.has(detection.id))

	// These are ballparking, but seem good enough for nearly all cases
	const isDetectionNearTop = $derived(factoredyMin < 30)
	const isDetectionNearRight = $derived(factoredxMin > $size.width * 0.66)

	onMount(() => {
		return () => {
			context.hovered.delete(detection.id)
		}
	})
</script>

<Container
	positionType="absolute"
	positionLeft={factoredxMin}
	positionTop={factoredyMin}
	borderColor={hovering ? detection.color : '#aaa'}
	borderWidth={2}
	width={factoredxMax - factoredxMin}
	height={factoredyMax - factoredyMin}
	onpointerleave={() => context.hovered.delete(detection.id)}
>
	{#if hovering}
		<Text
			positionType="absolute"
			positionBottom={isDetectionNearTop ? undefined : '100%'}
			positionTop={isDetectionNearTop ? -1 : undefined}
			positionLeft={isDetectionNearRight ? undefined : -2}
			positionRight={isDetectionNearRight ? -2 : undefined}
			borderColor={detection.color}
			backgroundColor={detection.color}
			color={lightTextColors.includes(detection.color) ? 'white' : 'black'}
			borderWidth={2}
			paddingX={8}
			paddingY={4}
			fontSize={11}
			fontWeight="medium"
			fontFamily="publicSans"
			text={`${detection.className} (${detection.confidence.toString()}%)`}
		/>
	{/if}
</Container>
