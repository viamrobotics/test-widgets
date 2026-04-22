<script lang="ts">
	import { useThrelte } from '@threlte/core'
	import { Container, Text } from 'threlte-uikit'

	import { lightTextColors } from './color'
	import { type Detection, useDetections } from './context.svelte'

	const { size } = useThrelte()

	interface Props {
		detection: Detection
		factor?: number
	}

	const { detection, factor = 0 }: Props = $props()

	const context = useDetections()

	const factoredxMin = $derived(Number(detection.xMin) * factor)
	const factoredxMax = $derived(Number(detection.xMax) * factor)
	const factoredyMin = $derived(Number(detection.yMin) * factor)
	const factoredyMax = $derived(Number(detection.yMax) * factor)

	let hovering = $state(false)

	// These are ballparking, but seem good enough for nearly all cases
	const isDetectionNearTop = $derived(factoredyMin < 30)
	const isDetectionNearRight = $derived(factoredxMin > $size.width * 0.66)
</script>

<Container
	positionType="absolute"
	positionLeft={factoredxMin}
	positionTop={factoredyMin}
	borderColor="#aaa"
	hover={{
		borderColor: detection.color,
	}}
	borderWidth={2}
	width={factoredxMax - factoredxMin}
	height={factoredyMax - factoredyMin}
	onpointerenter={() => {
		context.hovered.add(detection.id)
		hovering = true
	}}
	onpointerleave={() => {
		context.hovered.delete(detection.id)
		hovering = false
	}}
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
