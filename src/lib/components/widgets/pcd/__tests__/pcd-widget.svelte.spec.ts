import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { PerspectiveCamera, Points, PointsMaterial, Scene } from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../pcd-widget.svelte'
import { pcd } from './__fixtures__/pcd.ts'

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

const findPointCloudScene = (scenes: Scene[]) =>
	scenes.find((scene) => scene.getObjectByProperty('isPoints', true) !== undefined)

const renderedPointSize = (scenes: Scene[]) => {
	const points = findPointCloudScene(scenes)?.getObjectByProperty('isPoints', true)
	if (points instanceof Points && points.material instanceof PointsMaterial) {
		return points.material.size
	}
	return undefined
}

const renderedCameraUp = (scenes: Scene[]) => {
	const camera = findPointCloudScene(scenes)?.getObjectByProperty('isPerspectiveCamera', true)
	if (camera instanceof PerspectiveCamera) {
		return camera.up.toArray()
	}
	return undefined
}

// The shared fixture's lone point sits outside the default view, so the capture needs points at the origin.
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

describe('PCD widget', () => {
	const data = new TextEncoder().encode(pcd)
	const label = 'GetPointCloud'
	let user: ReturnType<typeof userEvent.setup>
	let scenes: Scene[]

	beforeEach(() => {
		user = userEvent.setup()
		scenes = observeThreeScenes()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('shows a default point size of 0.02', () => {
		render(Subject, { data, label })

		expect(screen.getByRole('spinbutton', { name: /point size/iu })).toHaveValue(0.02)
	})

	it('shows a default camera up vector of +z', () => {
		render(Subject, { data, label })

		expect(screen.getByRole('combobox', { name: /camera up vector/iu })).toHaveTextContent('+z')
	})

	it('names the frame after its label', () => {
		render(Subject, { data, label })

		expect(screen.getByRole('group', { name: label })).toBeInTheDocument()
	})

	it('offers the screenshot, picture-in-picture, and raw data downloads', () => {
		render(Subject, { data, label })

		expect(screen.getByRole('button', { name: /screenshot/iu })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /download raw data/iu })).toBeInTheDocument()
	})

	it('renders the point cloud at the default point size', async () => {
		render(Subject, { data, label })

		await expect.poll(() => renderedPointSize(scenes)).toBe(0.02)
	})

	it('points the scene camera up along +z by default', async () => {
		render(Subject, { data, label })

		await expect.poll(() => renderedCameraUp(scenes)).toEqual([0, 0, 1])
	})

	it('renders the point cloud at a point size the user enters', async () => {
		render(Subject, { data, label })
		const sizeInput = screen.getByRole('spinbutton', { name: /point size/iu })
		await user.clear(sizeInput)

		await user.type(sizeInput, '0.5')
		await user.tab()

		await expect.poll(() => renderedPointSize(scenes)).toBe(0.5)
	})

	it('points the scene camera along the up vector the user selects', async () => {
		render(Subject, { data, label })

		await user.click(screen.getByRole('combobox', { name: /camera up vector/iu }))
		await user.click(await screen.findByRole('option', { name: '-y' }))

		await expect.poll(() => renderedCameraUp(scenes)).toEqual([0, -1, 0])
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
		await expect.poll(() => renderedPointSize(scenes)).toBe(1)
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
})
