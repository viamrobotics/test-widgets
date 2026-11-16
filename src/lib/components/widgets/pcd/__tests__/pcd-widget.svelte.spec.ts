import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { PerspectiveCamera, Points, PointsMaterial, Scene } from 'three'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

describe('PCD widget', () => {
	const data = new TextEncoder().encode(pcd)
	let user: ReturnType<typeof userEvent.setup>
	let scenes: Scene[]

	beforeEach(() => {
		user = userEvent.setup()
		scenes = observeThreeScenes()
	})

	it('shows a default point size of 0.02', () => {
		render(Subject, { data })

		expect(screen.getByRole('spinbutton', { name: /point size/iu })).toHaveValue(0.02)
	})

	it('shows a default camera up vector of +z', () => {
		render(Subject, { data })

		expect(screen.getByRole('combobox', { name: /camera up vector/iu })).toHaveValue('0,0,1')
	})

	it('renders the point cloud at the default point size', async () => {
		render(Subject, { data })

		await expect.poll(() => renderedPointSize(scenes)).toBe(0.02)
	})

	it('points the scene camera up along +z by default', async () => {
		render(Subject, { data })

		await expect.poll(() => renderedCameraUp(scenes)).toEqual([0, 0, 1])
	})

	it('renders the point cloud at a point size the user enters', async () => {
		render(Subject, { data })
		const sizeInput = screen.getByRole('spinbutton', { name: /point size/iu })
		await user.clear(sizeInput)

		await user.type(sizeInput, '0.5')
		await user.tab()

		await expect.poll(() => renderedPointSize(scenes)).toBe(0.5)
	})

	it('points the scene camera along the up vector the user selects', async () => {
		render(Subject, { data })

		await user.selectOptions(screen.getByRole('combobox', { name: /camera up vector/iu }), '0,-1,0')

		await expect.poll(() => renderedCameraUp(scenes)).toEqual([0, -1, 0])
	})
})
