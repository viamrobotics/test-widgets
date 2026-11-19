import type { PaneNode } from '@viamrobotics/prime-panes'
import type { ResourceName } from '@viamrobotics/sdk'

import { render } from '@testing-library/svelte'
import { Detection, EncoderPositionType } from '@viamrobotics/sdk'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { PaneSize } from '../layout-minimum'

import { compositePane, entryPanes, type ResourcePane } from '../resource-pane'
import { resourcePaneMinimum } from '../resource-pane-minimums'
import InPaneFrame from './__fixtures__/in-pane-frame.svelte'

const state = vi.hoisted((): { data: Record<string, unknown> } => ({ data: {} }))

vi.mock('@viamrobotics/svelte-sdk', async (importOriginal) => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	return {
		...(await importOriginal<typeof import('@viamrobotics/svelte-sdk')>()),
		useConnectionStatus: () => ({ current: MachineConnectionEvent.CONNECTED }),
		useRobotClient: () => ({ current: undefined }),
		useResourceStatuses: () => ({ current: [{ name: { name: 'camera-1' } }] }),
		createResourceClient: () => ({ current: {} }),
		createStreamClient: () => ({ mediaStream: undefined }),
		createResourceQuery: (_client: unknown, method: string) => ({
			get data() {
				return state.data[method]
			},
			error: null,
			isLoading: false,
			isSuccess: true,
			isError: false,
			isFetching: false,
			fetchStatus: 'idle',
			refetch: () => Promise.resolve({ data: state.data[method], error: null }),
		}),
		createResourceMutation: () => ({
			mutate: () => {},
			mutateAsync: () => Promise.resolve(),
			isPending: false,
			error: null,
		}),
	}
})

const PART_ID = 'part-1'
const TOLERANCE_PX = 2
const PANE_BORDERS_PX = 2
const SETTLE_FRAMES = 20

const resource = (subtype: string, name: string, type = 'component'): ResourceName => ({
	namespace: 'rdk',
	type,
	subtype,
	name,
})

const FRAME_WIDTH = 640
const FRAME_HEIGHT = 360

const encodeFrame = async (mimeType: string) => {
	const canvas = new OffscreenCanvas(FRAME_WIDTH, FRAME_HEIGHT)
	const context = canvas.getContext('2d')
	if (!context) throw new Error('No 2D context to draw the frame')
	context.fillStyle = 'rgb(128 128 128)'
	context.fillRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT)
	const blob = await canvas.convertToBlob({ type: mimeType })
	return new Uint8Array(await blob.arrayBuffer())
}

const frames = { jpeg: new Uint8Array(), png: new Uint8Array() }

const POINT_CLOUD = new TextEncoder().encode(
	[
		'VERSION 0.7',
		'FIELDS x y z',
		'SIZE 4 4 4',
		'TYPE F F F',
		'COUNT 1 1 1',
		'WIDTH 2',
		'HEIGHT 1',
		'VIEWPOINT 0 0 0 1 0 0 0',
		'POINTS 2',
		'DATA ascii',
		'0 0 0',
		'1 1 1',
		'',
	].join('\n')
)

const READINGS = { temperature_c: 21.6, humidity_pct: 48.2, firmware: 'v2.4.1', uptime_s: 86_400 }

const SENSOR_DATA = { getReadings: READINGS }

const MOVEMENT_SENSOR_DATA = {
	getProperties: {
		positionSupported: true,
		orientationSupported: true,
		compassHeadingSupported: true,
		angularVelocitySupported: true,
		linearVelocitySupported: true,
		linearAccelerationSupported: true,
	},
	getPosition: {
		coordinate: { latitude: 40.123_456_7, longitude: -73.654_321_9 },
		altitudeM: 12.5,
	},
	getOrientation: { oX: 1.111, oY: 2.222, oZ: 3.333, theta: 45.678 },
	getCompassHeading: 123.456,
	getAngularVelocity: { x: 1.25, y: -2.5, z: 3.75 },
	getLinearVelocity: { x: 0.5, y: -1.5, z: 2.25 },
	getLinearAcceleration: { x: 9.81, y: -0.12, z: 0.34 },
	getAccuracy: { positionNmeaGgaFix: 4, positionHdop: 1.234, positionVdop: 4.567, accuracy: {} },
	getReadings: READINGS,
}

const POWER_SENSOR_DATA = {
	getVoltage: [12.5, true],
	getCurrent: [1.5, false],
	getPower: 18.75,
	getReadings: READINGS,
}

const ENCODER_DATA = {
	getProperties: { ticksCountSupported: true, angleDegreesSupported: true },
	getPosition: [123.456, EncoderPositionType.ANGLE_DEGREES],
}

const INPUT_CONTROLLER_DATA = {
	getEvents: [
		{ control: 'AbsoluteX', value: 0.5 },
		{ control: 'AbsoluteY', value: -0.25 },
		{ control: 'ButtonSouth', value: 1 },
		{ control: 'ButtonEast', value: 0 },
	],
}

const cameraData = () => ({
	getImages: { images: [{ sourceName: 'color', mimeType: 'image/jpeg', image: frames.jpeg }] },
	getPointCloud: POINT_CLOUD,
})

const visionData = () => ({
	getProperties: {
		classificationsSupported: true,
		detectionsSupported: true,
		objectPointCloudsSupported: true,
		defaultCamera: 'camera-1',
	},
	captureAllFromCamera: {
		image: { image: frames.png, mimeType: 'image/png' },
		detections: [
			new Detection({
				xMin: 100n,
				yMin: 60n,
				xMax: 300n,
				yMax: 240n,
				confidence: 0.9,
				className: 'person',
			}),
		],
		classifications: [
			{ className: 'dog', confidence: 0.5 },
			{ className: 'dragon', confidence: 0.4 },
		],
	},
	getObjectPointClouds: [],
})

interface MinimumRow {
	id: string
	resource: ResourceName
	data: () => Record<string, unknown>
}

const sensor = resource('sensor', 'sensor-1')
const movementSensor = resource('movement_sensor', 'movement-sensor-1')
const powerSensor = resource('power_sensor', 'power-sensor-1')
const encoder = resource('encoder', 'encoder-1')
const inputController = resource('input_controller', 'input-controller-1')
const camera = resource('camera', 'camera-1')
const vision = resource('vision', 'vision-1', 'service')

const ROWS: MinimumRow[] = [
	{ id: 'sensor-1::composite', resource: sensor, data: () => SENSOR_DATA },
	{
		id: 'movement-sensor-1::composite',
		resource: movementSensor,
		data: () => MOVEMENT_SENSOR_DATA,
	},
	{
		id: 'movement-sensor-1::get-position',
		resource: movementSensor,
		data: () => MOVEMENT_SENSOR_DATA,
	},
	{
		id: 'movement-sensor-1::get-orientation',
		resource: movementSensor,
		data: () => MOVEMENT_SENSOR_DATA,
	},
	{
		id: 'movement-sensor-1::get-compass-heading',
		resource: movementSensor,
		data: () => MOVEMENT_SENSOR_DATA,
	},
	{
		id: 'movement-sensor-1::get-accuracy',
		resource: movementSensor,
		data: () => MOVEMENT_SENSOR_DATA,
	},
	{ id: 'power-sensor-1::composite', resource: powerSensor, data: () => POWER_SENSOR_DATA },
	{ id: 'power-sensor-1::get-voltage', resource: powerSensor, data: () => POWER_SENSOR_DATA },
	{ id: 'power-sensor-1::get-current', resource: powerSensor, data: () => POWER_SENSOR_DATA },
	{ id: 'power-sensor-1::get-power', resource: powerSensor, data: () => POWER_SENSOR_DATA },
	{ id: 'encoder-1::composite', resource: encoder, data: () => ENCODER_DATA },
	{ id: 'encoder-1::get-position', resource: encoder, data: () => ENCODER_DATA },
	{
		id: 'input-controller-1::composite',
		resource: inputController,
		data: () => INPUT_CONTROLLER_DATA,
	},
	{ id: 'camera-1::composite', resource: camera, data: cameraData },
	{ id: 'vision-1::composite', resource: vision, data: visionData },
]

const paneFor = (row: MinimumRow): PaneNode<ResourcePane> => {
	const pane = [compositePane(row.resource), ...entryPanes(row.resource)].find(
		(candidate) => candidate?.id === row.id
	)
	if (!pane) throw new Error(`No pane for ${row.id}`)
	return pane
}

const nextFrame = () =>
	new Promise<void>((resolve) => {
		requestAnimationFrame(() => {
			resolve()
		})
	})

const afterLayoutSettles = async () => {
	await document.fonts.ready
	for (let frame = 0; frame < SETTLE_FRAMES; frame += 1) await nextFrame()
}

const renderedPaneParts = () => {
	const host = document.querySelector<HTMLElement>('[data-testid="pane-host"]')
	const frame = host?.querySelector<HTMLElement>('[data-pane-id]')
	const header = frame?.querySelector<HTMLElement>('[data-pane-header]')
	const bodyMinWidth = frame?.querySelector<HTMLElement>('div[style*="min-width"]')
	const body = bodyMinWidth?.parentElement
	if (!host || !frame || !header || !bodyMinWidth || !body) throw new Error('No pane rendered')
	return { host, frame, header, bodyMinWidth, body }
}

const elementsStyled = (root: HTMLElement, matches: (style: CSSStyleDeclaration) => boolean) =>
	[...root.querySelectorAll<HTMLElement>('*')].filter((element) =>
		matches(getComputedStyle(element))
	)

const liftContainerQueries = (root: HTMLElement) => {
	const containers = elementsStyled(root, (style) => style.containerType !== 'normal')
	for (const element of containers) element.style.containerType = 'normal'
	return () => {
		for (const element of containers) element.style.containerType = ''
	}
}

const letHeaderTitleTruncate = (header: HTMLElement) => {
	for (const element of elementsStyled(header, (style) => style.textOverflow === 'ellipsis')) {
		element.style.maxWidth = '0px'
	}
}

/**
 * The pane's smallest size as rendered, header and borders included. Width is the pane's
 * min-content plus its 2 px of borders. Height is its header plus the body's `scrollHeight` at
 * that width, plus the same 2 px. The host starts narrower than any pane, so media a widget sizes
 * to its container adds no width. The body's min-width comes from the row under test, so it is
 * cleared. A container query container reports no min-content, so containment is lifted while the
 * width is read. The header's title truncates by design, so it adds no width.
 */
const measureRenderedMinimum = async (pane: PaneNode<ResourcePane>): Promise<PaneSize> => {
	render(InPaneFrame, { paneNode: pane, partID: PART_ID })
	await afterLayoutSettles()
	const { host, frame, header, bodyMinWidth, body } = renderedPaneParts()
	bodyMinWidth.style.minWidth = '0px'

	const restoreContainerQueries = liftContainerQueries(frame)
	letHeaderTitleTruncate(header)
	frame.style.width = 'min-content'
	await nextFrame()
	const width = Math.ceil(frame.getBoundingClientRect().width)

	restoreContainerQueries()
	frame.style.width = ''
	host.style.width = `${String(width)}px`
	host.style.height = '1px'
	await afterLayoutSettles()
	const height = Math.ceil(header.getBoundingClientRect().height) + body.scrollHeight
	return { width, height: height + PANE_BORDERS_PX }
}

describe('PANE_MINIMUMS', () => {
	beforeAll(async () => {
		frames.jpeg = await encodeFrame('image/jpeg')
		frames.png = await encodeFrame('image/png')
	})

	beforeEach(() => {
		localStorage.clear()
	})

	it.each(ROWS)('holds $id at its rendered minimum, within 2 px', async (row) => {
		state.data = row.data()
		const pane = paneFor(row)

		const measured = await measureRenderedMinimum(pane)

		const listed = resourcePaneMinimum(pane.data)
		const drift = Math.max(
			Math.abs(measured.width - listed.width),
			Math.abs(measured.height - listed.height)
		)
		expect(
			drift,
			`${row.id} renders at ${String(measured.width)} x ${String(measured.height)}, PANE_MINIMUMS lists ${String(listed.width)} x ${String(listed.height)}`
		).toBeLessThanOrEqual(TOLERANCE_PX)
	})
})
