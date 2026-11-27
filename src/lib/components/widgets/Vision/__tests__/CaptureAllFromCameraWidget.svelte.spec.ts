import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import {
	Classification,
	Detection,
	Detection3D,
	GeometriesInFrame,
	Geometry,
	PointCloudObject,
	Pose,
	PoseInFrame,
	RectangularPrism,
	Struct,
	Transform,
	Vector3,
} from '@viamrobotics/sdk'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../CaptureAllFromCameraWidget.svelte'
import HostSubject from './__fixtures__/CaptureAllFromCameraHost.svelte'

const state = vi.hoisted(
	(): { data: Record<string, unknown>; cameras: string[]; pending: string[] } => ({
		data: {},
		cameras: [],
		pending: [],
	})
)

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createStreamClient: vi.fn(() => ({ mediaStream: undefined })),
		createResourceQuery: vi.fn((_client: unknown, method: string) => ({
			get data() {
				return state.data[method]
			},
			isLoading: false,
			get isSuccess() {
				return !state.pending.includes(method)
			},
			isError: false,
			isFetching: false,
			fetchStatus: 'idle',
			error: null,
			refetch: vi.fn(async () => ({})),
		})),
		useResourceStatuses: vi.fn(() => ({
			get current() {
				return state.cameras.map((name) => ({ name: { name } }))
			},
		})),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

const PROPS = { partID: 'test-part', resourceName: 'test-vision' }
const METHOD = 'captureAllFromCamera'

const callIfFunction = (value: unknown): unknown => (typeof value === 'function' ? value() : value)

const lastCaptureCall = () => {
	const index = vi
		.mocked(createResourceQuery)
		.mock.calls.findLastIndex(([, name]) => String(name) === METHOD)
	const call = vi.mocked(createResourceQuery).mock.calls[index]
	const result = vi.mocked(createResourceQuery).mock.results[index]
	if (call === undefined || result?.type !== 'return') {
		throw new Error(`No query was created for ${METHOD}`)
	}
	return { args: callIfFunction(call[2]), options: callIfFunction(call[3]), query: result.value }
}

const sentFlags = () => {
	const { args } = lastCaptureCall()
	if (!Array.isArray(args)) throw new Error('CaptureAllFromCamera was given no arguments')
	return args[1]
}

const supports = ({
	detections,
	classifications,
	objectPointClouds,
	detections3d = false,
	defaultCamera = '',
}: {
	detections: boolean
	classifications: boolean
	objectPointClouds: boolean
	detections3d?: boolean
	defaultCamera?: string
}) => {
	state.data.getProperties = {
		detectionsSupported: detections,
		classificationsSupported: classifications,
		objectPointCloudsSupported: objectPointClouds,
		detections3dSupported: detections3d,
		defaultCamera,
	}
}

const encodeImage = async (mimeType: string) => {
	const canvas = new OffscreenCanvas(4, 3)
	canvas.getContext('2d')?.fillRect(0, 0, 4, 3)
	const blob = await canvas.convertToBlob({ type: mimeType })
	return new Uint8Array(await blob.arrayBuffer())
}

const respond = async ({
	mimeType = 'image/png',
	detections = [],
	classifications = [],
	objectPointClouds = [],
	detections3d = [],
	extra,
}: {
	mimeType?: string
	detections?: Detection[]
	classifications?: Classification[]
	objectPointClouds?: PointCloudObject[]
	detections3d?: Detection3D[]
	extra?: Struct
} = {}) => {
	state.data[METHOD] = {
		image: { sourceName: '', image: await encodeImage(mimeType), mimeType },
		detections,
		classifications,
		objectPointClouds,
		detections3d,
		extra,
	}
}

const pcdWithPoints = (count: number) =>
	new TextEncoder().encode(
		['VERSION 0.7', 'FIELDS x y z', `POINTS ${count.toString()}`, 'DATA ascii', ''].join('\n')
	)

const openReturn = async () => {
	await userEvent.click(screen.getByRole('combobox', { name: 'Return' }))
	return screen.findByRole('listbox')
}

describe('CaptureAllFromCamera widget', () => {
	beforeEach(() => {
		state.data = {}
		state.cameras = []
		state.pending = []
	})

	it('creates the capture query disabled, so nothing is sent on render', () => {
		render(Subject, { props: PROPS })

		const { options, query } = lastCaptureCall()
		expect(options).toMatchObject({ enabled: false })
		expect(query.refetch).not.toHaveBeenCalled()
	})

	it('sends a capture when Capture is pressed', async () => {
		render(Subject, { props: PROPS })

		await userEvent.click(screen.getByRole('button', { name: 'Capture' }))

		expect(lastCaptureCall().query.refetch).toHaveBeenCalledTimes(1)
	})

	it('holds Capture back until GetProperties settles', async () => {
		state.pending = ['getProperties']
		render(Subject, { props: PROPS })
		const button = screen.getByRole('button', { name: 'Capture' })

		await userEvent.click(button)

		expect(button).toHaveAttribute('aria-disabled', 'true')
		expect(button).not.toHaveAttribute('aria-busy')
		expect(button).toHaveAccessibleDescription('Wait for GetProperties to answer.')
		expect(lastCaptureCall().query.refetch).not.toHaveBeenCalled()
	})

	it('draws the result of a capture sent once GetProperties has settled', async () => {
		supports({ detections: true, classifications: false, objectPointClouds: false })
		await respond()
		render(Subject, { props: PROPS })

		await userEvent.click(screen.getByRole('button', { name: 'Capture' }))

		expect(lastCaptureCall().query.refetch).toHaveBeenCalledTimes(1)
		expect(screen.getByRole('group', { name: 'CaptureAllFromCamera' })).toBeInTheDocument()
	})

	it('asks for 3D detections when supported, and lists each one with its transforms', async () => {
		supports({
			detections: false,
			classifications: false,
			objectPointClouds: false,
			detections3d: true,
		})
		await respond({
			detections3d: [
				new Detection3D({
					transforms: [
						new Transform({
							referenceFrame: 'mug',
							poseInObserverFrame: new PoseInFrame({ referenceFrame: 'cam-1' }),
						}),
					],
				}),
			],
			extra: Struct.fromJson({ model: 'yolo' }),
		})

		render(Subject, { props: PROPS })

		expect(sentFlags()).toMatchObject({ returnDetections3d: true })
		const list = screen.getByRole('list', { name: '3D detections' })
		expect(within(list).getByRole('button', { name: '3D detection 1' })).toBeInTheDocument()
		expect(within(list).getByRole('group', { name: 'mug' })).toHaveTextContent('in cam-1')
		expect(screen.getByText('model')).toBeInTheDocument()
		expect(screen.getByText('"yolo"')).toBeInTheDocument()
	})

	it('says a failed capture failed', async () => {
		render(Subject, { props: PROPS })
		lastCaptureCall().query.refetch.mockResolvedValueOnce({ error: new Error('no camera') })

		await userEvent.click(screen.getByRole('button', { name: 'Capture' }))

		await vi.waitFor(() =>
			expect(screen.getByTestId('status-line')).toHaveTextContent('Capture failed')
		)
	})

	it('turns on each flag GetProperties reports supported', () => {
		supports({ detections: true, classifications: false, objectPointClouds: true })

		render(Subject, { props: PROPS })

		expect(screen.getByRole('combobox', { name: 'Return' })).toHaveTextContent(
			'Image, Detections, Object point clouds'
		)
		expect(sentFlags()).toEqual({
			returnImage: true,
			returnDetections: true,
			returnClassifications: false,
			returnObjectPointClouds: true,
			returnDetections3d: false,
		})
	})

	it('returns only the image until GetProperties answers', () => {
		render(Subject, { props: PROPS })

		expect(sentFlags()).toEqual({
			returnImage: true,
			returnDetections: false,
			returnClassifications: false,
			returnObjectPointClouds: false,
			returnDetections3d: false,
		})
	})

	it('keeps an unsupported flag disabled and off when it is picked', async () => {
		supports({ detections: true, classifications: false, objectPointClouds: false })
		render(Subject, { props: PROPS })
		const listbox = await openReturn()
		const option = within(listbox).getByRole('option', { name: 'Classifications' })

		await userEvent.setup({ pointerEventsCheck: 0 }).click(option)

		expect(option).toHaveAttribute('aria-disabled', 'true')
		expect(option).toHaveAttribute('aria-selected', 'false')
		expect(sentFlags()).toMatchObject({ returnClassifications: false })
	})

	it('sends every flag off once the user clears them all', async () => {
		supports({ detections: true, classifications: false, objectPointClouds: false })
		render(Subject, { props: PROPS })
		const listbox = await openReturn()

		await userEvent.click(within(listbox).getByRole('option', { name: 'Image' }))
		await userEvent.click(within(listbox).getByRole('option', { name: 'Detections' }))

		expect(sentFlags()).toEqual({
			returnImage: false,
			returnDetections: false,
			returnClassifications: false,
			returnObjectPointClouds: false,
			returnDetections3d: false,
		})
		expect(screen.getByRole('button', { name: 'Capture' })).toBeEnabled()
	})

	it("sends the Camera row's camera", () => {
		state.cameras = ['cam-1']

		render(Subject, { props: PROPS })

		expect(screen.getByRole('combobox', { name: 'Camera' })).toHaveTextContent('cam-1')
		expect(lastCaptureCall().args).toEqual(['cam-1', expect.anything()])
	})

	it('hides the Camera row and sends the cameraName it is given', () => {
		state.cameras = ['cam-1']

		render(Subject, { props: { ...PROPS, cameraName: 'cam-2' } })

		expect(screen.queryByRole('combobox', { name: 'Camera' })).not.toBeInTheDocument()
		expect(lastCaptureCall().args).toEqual(['cam-2', expect.anything()])
	})

	it('draws no frame and asks for a capture before the first response', () => {
		render(Subject, { props: PROPS })

		expect(screen.queryByRole('group', { name: 'CaptureAllFromCamera' })).not.toBeInTheDocument()
		expect(screen.getByText('Press Capture to read the camera')).toBeInTheDocument()
	})

	it('draws the captured image in a frame with Screenshot', async () => {
		await respond()

		render(Subject, { props: PROPS })

		const frame = screen.getByRole('group', { name: 'CaptureAllFromCamera' })
		expect(within(frame).getByRole('img')).toHaveAttribute('src', expect.stringMatching(/^blob:/))
		expect(within(frame).getByRole('button', { name: 'Screenshot' })).toBeInTheDocument()
	})

	it('adds the image under the picked camera and its own mime type', async () => {
		state.cameras = ['cam-1']
		await respond({ mimeType: 'image/jpeg' })
		const onAddImage = vi.fn()
		render(HostSubject, { props: { onAddImage } })

		await userEvent.click(screen.getByRole('button', { name: 'Add to dataset' }))
		await vi.waitFor(() => {
			expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled()
		})
		await userEvent.click(screen.getByRole('button', { name: 'Add' }))

		await vi.waitFor(() => {
			expect(onAddImage).toHaveBeenCalledWith(
				expect.objectContaining({
					componentName: 'cam-1',
					methodName: 'captureAllFromCamera',
					mimeType: 'image/jpeg',
				})
			)
		})
	})

	it("adds an image from the default camera under the service's default camera name", async () => {
		supports({
			detections: true,
			classifications: true,
			objectPointClouds: true,
			defaultCamera: 'cam-default',
		})
		await respond()
		const onAddImage = vi.fn()
		render(HostSubject, { props: { onAddImage, cameraName: '' } })

		await userEvent.click(screen.getByRole('button', { name: 'Add to dataset' }))
		await vi.waitFor(() => {
			expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled()
		})
		await userEvent.click(screen.getByRole('button', { name: 'Add' }))

		await vi.waitFor(() => {
			expect(onAddImage).toHaveBeenCalledWith(
				expect.objectContaining({ componentName: 'cam-default' })
			)
		})
	})

	it('draws the detections and classifications in the response as rows', async () => {
		supports({ detections: true, classifications: true, objectPointClouds: false })
		await respond({
			detections: [
				new Detection({
					xMin: 1n,
					yMin: 2n,
					xMax: 3n,
					yMax: 4n,
					confidence: 0.5,
					className: 'dog',
				}),
			],
			classifications: [new Classification({ className: 'tabby cat', confidence: 0.912 })],
		})

		render(Subject, { props: PROPS })

		expect(
			within(screen.getByRole('list', { name: 'Detections' })).getByRole('listitem')
		).toHaveTextContent('dog 50.00 % (1, 2) to (3, 4)')
		expect(
			within(screen.getByRole('list', { name: 'Classifications' })).getByRole('listitem')
		).toHaveTextContent('tabby cat 91.20 %')
	})

	it('draws each object as its point count with its geometries in a folder', async () => {
		supports({ detections: false, classifications: false, objectPointClouds: true })
		await respond({
			objectPointClouds: [
				new PointCloudObject({
					pointCloud: pcdWithPoints(18_432),
					geometries: new GeometriesInFrame({
						referenceFrame: 'world',
						geometries: [
							new Geometry({
								label: 'crate',
								center: new Pose({ x: 1, y: 2, z: 3 }),
								geometryType: {
									case: 'box',
									value: new RectangularPrism({ dimsMm: new Vector3({ x: 1, y: 1, z: 1 }) }),
								},
							}),
						],
					}),
				}),
			],
		})

		render(Subject, { props: PROPS })

		const row = within(screen.getByRole('list', { name: 'Objects' })).getByRole('listitem')
		expect(within(row).getByRole('group', { name: 'Object 1' })).toHaveTextContent('18432 points')
		expect(within(row).getByRole('button', { name: 'Geometries' })).toBeInTheDocument()
	})

	it('reads - in each supported list when a capture returns nothing', async () => {
		supports({ detections: true, classifications: true, objectPointClouds: true })
		await respond()

		render(Subject, { props: PROPS })

		expect(screen.getByRole('group', { name: 'Detections' })).toHaveTextContent('Detections -')
		expect(screen.getByRole('group', { name: 'Classifications' })).toHaveTextContent(
			'Classifications -'
		)
		expect(screen.getByRole('group', { name: 'Objects' })).toHaveTextContent('-')
	})

	it('draws no list for a capability GetProperties reports unsupported', async () => {
		supports({ detections: true, classifications: false, objectPointClouds: false })
		await respond()

		render(Subject, { props: PROPS })

		expect(screen.getByRole('group', { name: 'Detections' })).toBeInTheDocument()
		expect(screen.queryByRole('group', { name: 'Classifications' })).not.toBeInTheDocument()
		expect(screen.queryByRole('group', { name: 'Objects' })).not.toBeInTheDocument()
	})
})
