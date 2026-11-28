import '../../../../../app.css'

import { render } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'

import Subject from '../PCDWidget.svelte'
import { pcd } from './__fixtures__/pcd.ts'

const findCanvas = () => {
	const canvas = document.querySelector('canvas')
	if (!canvas) throw new Error('No canvas rendered')
	return canvas
}

describe('PCD widget in a resizing pane', () => {
	const data = new TextEncoder().encode(pcd)

	it('keeps the canvas as wide as its container when the container resizes', async () => {
		const { container } = render(Subject, { data, label: 'GetPointCloud' })
		const pane = container.firstElementChild
		if (!(pane instanceof HTMLElement)) throw new Error('No pane rendered')
		pane.style.width = '320px'

		await expect.poll(() => findCanvas().clientWidth).toBe(320)

		pane.style.width = '480px'

		await expect.poll(() => findCanvas().clientWidth).toBe(480)
		await expect.poll(() => findCanvas().clientHeight).toBe(480)
	})
})
