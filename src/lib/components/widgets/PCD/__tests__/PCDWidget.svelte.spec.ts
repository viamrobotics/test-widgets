import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { traits } from '@viamrobotics/visualization'
import { createRawSnippet } from 'svelte'
import { BufferGeometry, type Object3D, Scene, Vector3, type Vector3Tuple } from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { MediaFitState } from '../../../MediaFrame/media-fit.svelte'
import type { MediaFrameCapture } from '../../../MediaFrame/media-frame-capture'

import { CANVAS_FITS } from '../../../MediaFrame/media-fit'
import Subject from '../PCDWidget.svelte'
import { pcd } from './__fixtures__/pcd.ts'

const pipHost = vi.hoisted(() => ({ available: false }))

vi.mock('#lib/pip/context.svelte.js', () => ({
	providePip: () => ({}),
	usePip: () => ({
		toggle: async () => {},
		setStream: () => {},
		setRate: () => {},
		error: undefined,
		readyState: 'inactive',
		resourceName: undefined,
	}),
	hasPip: () => pipHost.available,
}))

// The visualizer parses the cloud in a worker and compiles its shaders before the first frame.
const SCENE_WIDTH = '160px'
const SCENE_POLL = { timeout: 8000 }

const observeThreeScenes = () => {
	const scenes: Scene[] = []
	const devtools = new EventTarget()
	devtools.addEventListener('observe', (event) => {
		if (event instanceof CustomEvent && event.detail instanceof Scene) {
			scenes.push(event.detail)
		}
	})
	vi.stubGlobal('__THREE_DEVTOOLS__', devtools)
	return scenes
}

const mediaBoxAspectRatio = () =>
	screen
		.getByRole('group', { name: 'GetPointCloud' })
		.querySelector<HTMLElement>('[style*="aspect-ratio"]')?.style.aspectRatio

interface DrawnCloud extends Object3D {
	size: { value: number }
}

// The visualizer draws a cloud as its own object type, which carries the drawn point size.
const isDrawnCloud = (object: Object3D): object is DrawnCloud =>
	'size' in object &&
	typeof object.size === 'object' &&
	object.size !== null &&
	'value' in object.size &&
	typeof object.size.value === 'number'

const findDrawnCloud = (scenes: Scene[]) => {
	let found: DrawnCloud | undefined
	for (const scene of scenes) {
		scene.traverse((object) => {
			if (isDrawnCloud(object)) found = object
		})
	}
	return found
}

interface DebugWorld {
	query: (
		trait: typeof traits.Points
	) => { get: (trait: typeof traits.BufferGeometry) => unknown }[]
}

const isDebugWorld = (value: unknown): value is DebugWorld =>
	typeof value === 'object' && value !== null && 'query' in value

/** How many points the cloud entity holds, read from the world the visualizer exposes for debugging. */
const heldPointCount = () => {
	const debug: unknown = Reflect.get(globalThis, '__koota__')
	const world: unknown =
		typeof debug === 'object' && debug !== null ? Reflect.get(debug, 'world') : undefined
	if (!isDebugWorld(world)) return undefined
	const geometry = world.query(traits.Points)[0]?.get(traits.BufferGeometry)
	return geometry instanceof BufferGeometry ? geometry.getAttribute('position').count : undefined
}

const renderedPointSize = (scenes: Scene[]) => findDrawnCloud(scenes)?.size.value

/** Where the cloud's own `axis` points in the scene, which is z-up. */
const renderedDirectionOf = (scenes: Scene[], axis: Vector3Tuple) => {
	const cloud = findDrawnCloud(scenes)
	if (!cloud) return undefined
	return (
		new Vector3(...axis)
			.transformDirection(cloud.matrix)
			.toArray()
			// Adding 0 turns a rounded -0 into 0, which `toEqual` tells apart.
			.map((value) => Math.round(value) + 0)
	)
}

// The shared fixture's lone point sits away from the origin, so the scene specs use points at it.
const centeredData = new TextEncoder().encode(
	[
		'# .PCD v.7 - Point Cloud Data file format',
		'VERSION .7',
		'FIELDS x y z rgb',
		'SIZE 4 4 4 4',
		'TYPE F F F F',
		'COUNT 1 1 1 1',
		'WIDTH 2',
		'HEIGHT 1',
		'VIEWPOINT 0 0 0 1 0 0 0',
		'POINTS 2',
		'DATA ascii',
		'0 0 0 4.2108e+06',
		'0.1 0 0.1 4.2108e+06',
	].join('\n')
)

// A second cloud with one more point, as the next tick of a polling feed would deliver.
const nextData = new TextEncoder().encode(
	`${new TextDecoder()
		.decode(centeredData)
		.replace('WIDTH 2', 'WIDTH 3')
		.replace('POINTS 2', 'POINTS 3')}\n0.2 0 0.2 4.2108e+06`
)

const unreadableData = new TextEncoder().encode('not a point cloud')

describe('PCD widget', () => {
	const data = new TextEncoder().encode(pcd)
	const label = 'GetPointCloud'
	let user: ReturnType<typeof userEvent.setup>
	let scenes: Scene[]

	beforeEach(() => {
		user = userEvent.setup()
		scenes = observeThreeScenes()
		// Headless Chromium draws WebGL on the CPU. A small canvas keeps this file from starving the specs running beside it.
		document.body.style.width = SCENE_WIDTH
	})

	afterEach(() => {
		pipHost.available = false
		document.body.style.width = ''
		vi.restoreAllMocks()
	})

	it('shows a default point size of 0.02', () => {
		render(Subject, { data, label })

		expect(screen.getByRole('spinbutton', { name: /point size/iu })).toHaveValue(0.02)
	})

	it('shows a default up axis of +z', () => {
		render(Subject, { data, label })

		expect(screen.getByRole('combobox', { name: 'Up axis' })).toHaveTextContent('+z')
	})

	it('names the frame after its label', () => {
		render(Subject, { data, label })

		expect(screen.getByRole('group', { name: label })).toBeInTheDocument()
	})

	it('offers the screenshot, picture-in-picture, and raw data downloads', () => {
		pipHost.available = true
		render(Subject, { data, label })

		expect(screen.getByRole('button', { name: /screenshot/iu })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /picture-in-picture/iu })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /download raw data/iu })).toBeInTheDocument()
	})

	it('downloads the raw bytes as pointcloud.pcd', async () => {
		const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:pcd')
		vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
		const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
		render(Subject, { data, label })

		await user.click(screen.getByRole('button', { name: /download raw data/iu }))

		expect(createObjectURL).toHaveBeenCalledOnce()
		const file = createObjectURL.mock.calls[0]?.[0]
		if (!(file instanceof File)) throw new Error('Expected the download to build a File')
		expect(file.name).toBe('pointcloud.pcd')
		expect(file.type).toBe('pointcloud/pcd')
		expect(file.size).toBe(data.byteLength)
		expect(click).toHaveBeenCalledOnce()
		expect(click.mock.contexts[0]).toHaveProperty('download', 'pointcloud.pcd')
	})

	it('renders the point cloud at the default point size', async () => {
		render(Subject, { data: centeredData, label })

		await expect.poll(() => renderedPointSize(scenes), SCENE_POLL).toBe(0.02)
	})

	it('stands the cloud on its own +z by default', async () => {
		render(Subject, { data: centeredData, label })

		await expect.poll(() => renderedDirectionOf(scenes, [0, 0, 1]), SCENE_POLL).toEqual([0, 0, 1])
	})

	it('renders the point cloud at a point size the user enters', async () => {
		render(Subject, { data: centeredData, label })
		const sizeInput = screen.getByRole('spinbutton', { name: /point size/iu })
		await user.clear(sizeInput)

		await user.type(sizeInput, '0.5')
		await user.tab()

		await expect.poll(() => renderedPointSize(scenes), SCENE_POLL).toBe(0.5)
	})

	it('stands the cloud on the up axis the user selects', async () => {
		render(Subject, { data: centeredData, label })
		await expect.poll(() => renderedDirectionOf(scenes, [0, 0, 1]), SCENE_POLL).toEqual([0, 0, 1])

		await user.click(screen.getByRole('combobox', { name: 'Up axis' }))
		await user.click(await screen.findByRole('option', { name: '-y' }))

		await expect.poll(() => renderedDirectionOf(scenes, [0, -1, 0]), SCENE_POLL).toEqual([0, 0, 1])
	})

	it('stands the cloud on -z, the axis opposite the default', async () => {
		render(Subject, { data: centeredData, label })
		await expect.poll(() => renderedDirectionOf(scenes, [0, 0, 1]), SCENE_POLL).toEqual([0, 0, 1])

		await user.click(screen.getByRole('combobox', { name: 'Up axis' }))
		await user.click(await screen.findByRole('option', { name: '-z' }))

		await expect.poll(() => renderedDirectionOf(scenes, [0, 0, -1]), SCENE_POLL).toEqual([0, 0, 1])
	})

	it('keeps the point size and the up axis on the cloud a feed replaces', async () => {
		const { rerender } = render(Subject, { data: centeredData, label })
		const sizeInput = screen.getByRole('spinbutton', { name: /point size/iu })
		await user.clear(sizeInput)
		await user.type(sizeInput, '0.5')
		await user.click(screen.getByRole('combobox', { name: 'Up axis' }))
		await user.click(await screen.findByRole('option', { name: '-y' }))
		await expect.poll(() => renderedDirectionOf(scenes, [0, -1, 0]), SCENE_POLL).toEqual([0, 0, 1])

		await rerender({ data: nextData, label })

		await expect.poll(heldPointCount, SCENE_POLL).toBe(3)
		await expect.poll(() => renderedDirectionOf(scenes, [0, -1, 0]), SCENE_POLL).toEqual([0, 0, 1])
		await expect.poll(() => renderedPointSize(scenes), SCENE_POLL).toBe(0.5)
	})

	it('keeps the drawn point size when the user enters 0', async () => {
		render(Subject, { data: centeredData, label })
		await expect.poll(() => renderedPointSize(scenes), SCENE_POLL).toBe(0.02)
		const sizeInput = screen.getByRole('spinbutton', { name: /point size/iu })

		await user.clear(sizeInput)
		await user.type(sizeInput, '0')
		await user.tab()

		expect(renderedPointSize(scenes)).toBe(0.02)
	})

	it('mounts more views over a page lifetime than the visualizer allows live worlds', async () => {
		const MOUNTS = 17
		for (let count = 0; count < MOUNTS; count += 1) {
			const { unmount } = render(Subject, { data: centeredData, label })
			// The visualizer mounts its plugins once its renderer is ready.
			await screen.findByRole('button', { name: 'Measurement' })
			unmount()
			// The world is freed a microtask after the unmount.
			await Promise.resolve()
		}
		render(Subject, { data: centeredData, label })

		expect(screen.getByRole('group', { name: label })).toBeInTheDocument()
	})

	it('says the point cloud could not be read when its bytes do not parse', async () => {
		render(Subject, { data: unreadableData, label })

		expect(await screen.findByRole('alert')).toHaveTextContent('The point cloud could not be read')
	})

	it('clears the error when the next bytes parse', async () => {
		const { rerender } = render(Subject, { data: unreadableData, label })
		await screen.findByRole('alert')

		await rerender({ data: centeredData, label })

		await expect.poll(() => screen.queryByRole('alert'), SCENE_POLL).not.toBeInTheDocument()
	})

	it('adds the PCD bytes to the dataset, previewed by a capture of the scene', async () => {
		const onConfirm = vi.fn<(capture: MediaFrameCapture) => Promise<void>>(async () => {})
		const form = createRawSnippet(() => ({ render: () => '<p>Host form</p>' }))
		render(Subject, {
			data: centeredData,
			label,
			addToDataset: { form, onConfirm, resourceName: label, methodName: 'getPointCloud' },
		})
		await expect.poll(() => renderedPointSize(scenes), SCENE_POLL).toBe(0.02)

		await user.click(screen.getByRole('button', { name: 'Add to dataset' }))
		await screen.findByRole('img', { name: `Preview of the capture from ${label}` }, SCENE_POLL)
		await user.click(screen.getByRole('button', { name: 'Add' }))

		await expect.poll(() => onConfirm.mock.calls.length).toBe(1)
		const [capture] = onConfirm.mock.calls[0] ?? []
		expect(capture?.binaryData).toBe(centeredData)
		expect(capture?.mimeType).toBe('pointcloud/pcd')
		expect(capture?.preview?.mimeType).toBe('image/png')
	})

	it('offers no Add to dataset to a host that takes images only', () => {
		render(Subject, {
			data: centeredData,
			label,
			addToDataset: { onConfirm: async () => {}, resourceName: label, methodName: 'getPointCloud' },
		})

		expect(screen.queryByRole('button', { name: 'Add to dataset' })).not.toBeInTheDocument()
	})

	it('saves a screenshot of the drawn point cloud, not a cleared buffer', async () => {
		const saved: Blob[] = []
		vi.spyOn(URL, 'createObjectURL').mockImplementation((object) => {
			if (object instanceof Blob) saved.push(object)
			return 'blob:screenshot'
		})
		vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
		vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
		render(Subject, { data: centeredData, label })
		const sizeInput = screen.getByRole('spinbutton', { name: /point size/iu })
		await user.clear(sizeInput)
		await user.type(sizeInput, '1')
		await user.tab()
		await expect.poll(() => renderedPointSize(scenes), SCENE_POLL).toBe(1)
		// Let the first frame draw and the browser clear its buffer.
		await new Promise<void>((resolve) => {
			setTimeout(resolve, 300)
		})

		await user.click(screen.getByRole('button', { name: /screenshot/iu }))

		await expect.poll(() => saved.length).toBe(1)
		expect(saved[0]?.type).toBe('image/png')
		const bitmap = await createImageBitmap(saved[0])
		const context = new OffscreenCanvas(bitmap.width, bitmap.height).getContext('2d')
		if (!context) throw new Error('No 2D context to read the screenshot')
		context.drawImage(bitmap, 0, 0)
		const pixels = context.getImageData(0, 0, bitmap.width, bitmap.height).data
		const clear = pixels.slice(0, 4)
		const drawn = pixels.some((value, index) => value !== clear[index % 4])
		expect(drawn).toBe(true)
	})

	it('offers the measure tool and the camera buttons over the scene', async () => {
		render(Subject, { data: centeredData, label })

		expect(await screen.findByRole('button', { name: 'Measurement' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Fit scene in view' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Reset camera' })).toBeInTheDocument()
	})

	it('shows the Fit select at the fit it is given', () => {
		const fit: MediaFitState = { current: 'fit', fits: CANVAS_FITS }

		render(Subject, { data, label, fit })

		expect(screen.getByRole('combobox', { name: 'Fit' })).toHaveTextContent('Fit')
	})

	it('fills the frame instead of holding the square under Fit', () => {
		const fit: MediaFitState = { current: 'fit', fits: CANVAS_FITS }

		render(Subject, { data, label, fit })

		expect(mediaBoxAspectRatio()).toBeUndefined()
	})

	it('shows Start feed automatically before Screenshot when given', () => {
		render(Subject, { data, label, startAutomatically: true })

		const checkbox = screen.getByRole('checkbox', { name: 'Start feed automatically' })
		const screenshot = screen.getByRole('button', { name: /screenshot/iu })
		expect(checkbox).toBeChecked()
		expect(
			checkbox.compareDocumentPosition(screenshot) & Node.DOCUMENT_POSITION_FOLLOWING,
			'the checkbox precedes Screenshot'
		).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
	})

	it('holds the square with no Fit select and no start checkbox when neither is given', () => {
		render(Subject, { data, label })

		expect(mediaBoxAspectRatio()).toBe('1 / 1')
		expect(screen.queryByRole('combobox', { name: 'Fit' })).not.toBeInTheDocument()
		expect(
			screen.queryByRole('checkbox', { name: 'Start feed automatically' })
		).not.toBeInTheDocument()
	})
})
