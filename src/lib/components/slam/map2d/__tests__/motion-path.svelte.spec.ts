import type { Scene } from 'three'

import { cleanup, render } from '@threlte/test'
import { tick } from 'svelte'
import { Line2 } from 'three/examples/jsm/lines/Line2.js'
import { beforeEach, describe, expect, it } from 'vitest'

import Subject from '../motion-path.svelte'

const lineIn = (scene: Scene): Line2 | undefined => {
	const found = scene.getObjectByProperty('isLine2', true)
	return found instanceof Line2 ? found : undefined
}

const segmentPositions = (line: Line2 | undefined): number[] => [
	...(line?.geometry.getAttribute('instanceStart').array ?? []),
]

const disposalOf = (line: Line2 | undefined) => {
	const disposal = { happened: false }
	line?.geometry.addEventListener('dispose', () => {
		disposal.happened = true
	})
	return disposal
}

describe('<MotionPath>', () => {
	beforeEach(() => cleanup())

	it('draws the path as one line through its points at z 0', () => {
		const { scene } = render(Subject, { path: new Float32Array([1, 2, 3, 4]) })

		expect(segmentPositions(lineIn(scene))).toEqual([1, 2, 0, 3, 4, 0])
	})

	it('draws no line without a path', () => {
		const { scene } = render(Subject, { path: undefined })

		expect(lineIn(scene)).toBeUndefined()
	})

	it('redraws the line when the path changes', async () => {
		const { scene, rerender } = render(Subject, { path: new Float32Array([1, 2, 3, 4]) })

		await rerender({ path: new Float32Array([5, 6, 7, 8]) })
		await tick()

		expect(segmentPositions(lineIn(scene))).toEqual([5, 6, 0, 7, 8, 0])
	})

	it('disposes the geometry a new path replaces', async () => {
		const { scene, rerender } = render(Subject, { path: new Float32Array([1, 2, 3, 4]) })
		const disposal = disposalOf(lineIn(scene))

		await rerender({ path: new Float32Array([5, 6, 7, 8]) })
		await tick()

		expect(disposal.happened, 'the replaced geometry kept its GPU buffers').toBe(true)
	})

	it('disposes the geometry on unmount', async () => {
		const { scene, unmount } = render(Subject, { path: new Float32Array([1, 2, 3, 4]) })
		const disposal = disposalOf(lineIn(scene))

		unmount()
		await tick()

		expect(disposal.happened, 'the unmounted geometry kept its GPU buffers').toBe(true)
	})
})
