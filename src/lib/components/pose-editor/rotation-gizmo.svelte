<script lang="ts">
	import { Quaternion, Vector3 } from 'three'

	import {
		type OrientationVector,
		orientationVectorToQuaternion,
		quaternionToOrientationVector,
	} from '$lib/orientation-vector-quaternion'

	import { arcPath, GIZMO_SIZE, type GizmoAxis, projectPoint, rollRingPath } from './gizmo-geometry'
	import {
		axisArcRotation,
		keyboardRotation,
		rollRotation,
		trackballRotation,
	} from './gizmo-rotation'

	type Ring = GizmoAxis | 'roll'

	type PadPointerEvent = PointerEvent & { currentTarget: HTMLElement }

	interface Props {
		orientation: OrientationVector
		id: string
	}

	interface Drag {
		mode: Ring | 'free'
		pointerId: number
		startRotation: Quaternion
		startX: number
		startY: number
		startAngle: number
	}

	let { orientation = $bindable(), id }: Props = $props()

	const AXES: readonly GizmoAxis[] = ['x', 'y', 'z']
	const FOREGROUND = 'currentColor'
	const RING_COLORS: Record<Ring, string> = {
		x: 'red',
		y: 'green',
		z: 'blue',
		roll: FOREGROUND,
	}
	// White 10 px label text needs 4.5:1. Pure red gives about 4.0:1, so the X label circle is darker.
	const LABEL_COLORS: Record<GizmoAxis, string> = {
		x: '#e00000',
		y: RING_COLORS.y,
		z: RING_COLORS.z,
	}
	const CENTER = GIZMO_SIZE / 2
	const AXIS_TIP_LENGTH = 0.7
	const LABEL_RADIUS = 8
	const LABEL_FONT_SIZE = 10
	const LABEL_BASELINE_OFFSET = 4
	const AXIS_LINE_WIDTH = 2
	const RING_WIDTH = 1
	const ACTIVE_RING_WIDTH = 2
	const HIT_PATH_WIDTH = 5
	const RESTING_RING_OPACITY = 0.6
	const SHIFT_KEY_SCALE = 10
	const ALT_KEY_SCALE = 0.1
	const HINT =
		'Drag a ring to turn about its axis, the outer ring to roll, or elsewhere to rotate freely. Arrow keys rotate. The orientation fields show the same values.'

	const ARROW_DIRECTIONS = new Map([
		['ArrowRight', { x: 1, y: 0 }],
		['ArrowLeft', { x: -1, y: 0 }],
		['ArrowUp', { x: 0, y: 1 }],
		['ArrowDown', { x: 0, y: -1 }],
	])

	const AXIS_TIPS = AXES.flatMap((axis, axisIndex) =>
		[1, -1].map((sign) => ({
			label: sign > 0 ? axis.toUpperCase() : `-${axis.toUpperCase()}`,
			color: sign > 0 ? RING_COLORS[axis] : FOREGROUND,
			labelColor: sign > 0 ? LABEL_COLORS[axis] : FOREGROUND,
			point: new Vector3().setComponent(axisIndex, sign * AXIS_TIP_LENGTH),
		}))
	)

	const ROLL_RING = rollRingPath()

	let drag = $state.raw<Drag>()
	let hoveredRing = $state<Ring>()
	let grabbedRing: Ring | undefined

	const rotation = $derived(orientationVectorToQuaternion(orientation, new Quaternion()))

	const arcs = $derived(
		AXES.map((axis) => ({
			axis,
			back: arcPath(axis, 'back', rotation),
			front: arcPath(axis, 'front', rotation),
		}))
	)

	const tips = $derived(
		AXIS_TIPS.map((tip) => ({ ...tip, ...projectPoint(tip.point, rotation) })).toSorted(
			(nearer, farther) => nearer.depth - farther.depth
		)
	)

	const isHighlighted = (ring: Ring) => hoveredRing === ring || drag?.mode === ring

	const angleAroundCenter = (event: PadPointerEvent) => {
		const bounds = event.currentTarget.getBoundingClientRect()
		return Math.atan2(
			event.clientY - (bounds.top + bounds.height / 2),
			event.clientX - (bounds.left + bounds.width / 2)
		)
	}

	const draggedRotation = (current: Drag, event: PadPointerEvent) => {
		if (current.mode === 'free') {
			return trackballRotation(
				current.startRotation,
				event.clientX - current.startX,
				event.clientY - current.startY
			)
		}
		const turn = angleAroundCenter(event) - current.startAngle
		if (current.mode === 'roll') {
			return rollRotation(current.startRotation, turn)
		}
		return axisArcRotation(current.startRotation, current.mode, turn)
	}

	const startDrag = (event: PadPointerEvent) => {
		const mode = grabbedRing ?? 'free'
		grabbedRing = undefined
		event.currentTarget.setPointerCapture(event.pointerId)
		drag = {
			mode,
			pointerId: event.pointerId,
			startRotation: orientationVectorToQuaternion(orientation, new Quaternion()),
			startX: event.clientX,
			startY: event.clientY,
			startAngle: angleAroundCenter(event),
		}
	}

	const moveDrag = (event: PadPointerEvent) => {
		if (!drag || event.pointerId !== drag.pointerId) return
		orientation = quaternionToOrientationVector(draggedRotation(drag, event))
	}

	const endDrag = (event: PointerEvent) => {
		if (drag?.pointerId !== event.pointerId) return
		drag = undefined
	}

	const rotateWithArrowKey = (event: KeyboardEvent) => {
		const direction = ARROW_DIRECTIONS.get(event.key)
		if (!direction) return
		event.preventDefault()
		const scale = (event.shiftKey ? SHIFT_KEY_SCALE : 1) * (event.altKey ? ALT_KEY_SCALE : 1)
		orientation = quaternionToOrientationVector(
			keyboardRotation(rotation, direction.x * scale, direction.y * scale)
		)
	}
</script>

{#snippet ringStroke(path: string, ring: Ring)}
	<path
		d={path}
		stroke={isHighlighted(ring) ? RING_COLORS[ring] : FOREGROUND}
		stroke-opacity={isHighlighted(ring) ? 1 : RESTING_RING_OPACITY}
		stroke-width={drag?.mode === ring ? ACTIVE_RING_WIDTH : RING_WIDTH}
	/>
{/snippet}

{#snippet hitPath(path: string, ring: Ring)}
	<path
		d={path}
		stroke="transparent"
		stroke-width={HIT_PATH_WIDTH}
		pointer-events="stroke"
		role="presentation"
		onpointerdown={() => {
			grabbedRing = ring
		}}
		onpointerenter={() => {
			hoveredRing = ring
		}}
		onpointerleave={() => {
			hoveredRing = undefined
		}}
	/>
{/snippet}

<div {id}>
	<span
		id="{id}-hint"
		class="sr-only">{HINT}</span
	>
	<!-- A custom 2D control takes its own keys and drags, which the "application" role announces. No native element does that. -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
	<div
		class="text-default focus-visible:ring-gray-9 block w-fit cursor-move touch-none rounded select-none focus-visible:ring-2 focus-visible:outline-none"
		tabindex="0"
		role="application"
		aria-label="Rotation gizmo"
		aria-describedby="{id}-hint"
		onpointerdown={startDrag}
		onpointermove={moveDrag}
		onpointerup={endDrag}
		onlostpointercapture={endDrag}
		onkeydown={rotateWithArrowKey}
	>
		<svg
			class="block max-w-none shrink-0"
			width={GIZMO_SIZE}
			height={GIZMO_SIZE}
			viewBox="0 0 {GIZMO_SIZE} {GIZMO_SIZE}"
			fill="none"
			stroke-linecap="round"
			stroke-linejoin="round"
			pointer-events="none"
			aria-hidden="true"
		>
			{#each arcs as { axis, back } (axis)}
				{@render ringStroke(back, axis)}
				{@render hitPath(back, axis)}
			{/each}

			{#each tips as { label, color, x, y } (label)}
				<line
					x1={CENTER}
					y1={CENTER}
					x2={x}
					y2={y}
					stroke={color}
					stroke-width={AXIS_LINE_WIDTH}
				/>
			{/each}

			{#each arcs as { axis, front } (axis)}
				{@render ringStroke(front, axis)}
				{@render hitPath(front, axis)}
			{/each}

			{@render ringStroke(ROLL_RING, 'roll')}
			{@render hitPath(ROLL_RING, 'roll')}

			{#each tips as { label, labelColor, x, y } (label)}
				<g transform="translate({x} {y})">
					<circle
						r={LABEL_RADIUS}
						fill={labelColor}
					/>
					<text
						y={LABEL_BASELINE_OFFSET}
						text-anchor="middle"
						font-size={LABEL_FONT_SIZE}
						fill="white"
						stroke="white"
						stroke-width="1">{label}</text
					>
				</g>
			{/each}
		</svg>
	</div>
</div>
