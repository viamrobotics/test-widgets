import '../../../../../app.css'

import { render, screen } from '@testing-library/svelte'
import { WebGLRenderer } from 'three'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Subject from '../pcd-widget.svelte'
import { pcd } from './__fixtures__/pcd.ts'

const SETTLE_MS = 400

const observeRenderers = () => {
	const renderers: WebGLRenderer[] = []
	const devtools = new EventTarget()
	devtools.addEventListener('observe', (event) => {
		if (event instanceof CustomEvent && event.detail instanceof WebGLRenderer) {
			renderers.push(event.detail)
		}
	})
	vi.stubGlobal('__THREE_DEVTOOLS__', devtools)
	return renderers
}

const drawnFrames = (renderers: WebGLRenderer[]) =>
	renderers.reduce((total, renderer) => total + renderer.info.render.frame, 0)

const findCanvas = () => {
	const canvas = document.querySelector('canvas')
	if (!canvas) throw new Error('No canvas rendered')
	return canvas
}

const sleep = (ms: number) =>
	new Promise<void>((resolve) => {
		setTimeout(resolve, ms)
	})

describe('PCD widget in a resizing pane', () => {
	const data = new TextEncoder().encode(pcd)

	afterEach(() => {
		vi.unstubAllGlobals()
	})

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

	it('redraws after a resize and then stops drawing without a per-frame loop', async () => {
		const renderers = observeRenderers()
		const { container } = render(Subject, { data, label: 'GetPointCloud' })
		const pane = container.firstElementChild
		if (!(pane instanceof HTMLElement)) throw new Error('No pane rendered')
		pane.style.width = '320px'
		await expect.poll(() => findCanvas().clientWidth).toBe(320)
		await sleep(SETTLE_MS)

		const framesBefore = drawnFrames(renderers)
		pane.style.width = '480px'

		await expect.poll(() => drawnFrames(renderers)).toBeGreaterThan(framesBefore)
		await sleep(SETTLE_MS)
		const settled = drawnFrames(renderers)
		await sleep(SETTLE_MS)

		expect(drawnFrames(renderers)).toBe(settled)
		expect(screen.getByRole('group', { name: 'GetPointCloud' })).toBeInTheDocument()
	})
})
