import { describe, expect, it } from 'vitest'

import { groupDiscoveries } from '../group-discoveries'
import { pickVariant } from '../pick-variant'
import { loneIndexed, makeConfig, webcamModes } from './__fixtures__/discoveries-config'

describe('pickVariant', () => {
	const [webcam] = groupDiscoveries(webcamModes)

	it('lands on the first variant that holds the pick when nothing else conflicts', () => {
		// Variant 0 is 640 wide at 30 fps. Picking 1280 keeps height 480 for no variant, so the
		// first 1280 variant with the most kept values wins.
		expect(pickVariant(webcam!, 0, 'width_px', 1280)).toBe(1)
	})

	it('keeps the most other picks', () => {
		// Variant 4 is 640x480 at 60 fps. Picking 30 fps keeps width and height at variant 0.
		expect(pickVariant(webcam!, 4, 'frame_rate', 30)).toBe(0)
		// Variant 3 is 1280x720 at 60. Picking 640 keeps frame_rate 60 only at variant 4.
		expect(pickVariant(webcam!, 3, 'width_px', 640)).toBe(4)
	})

	it('prefers the first of equally good variants', () => {
		const resource = {
			name: 'x',
			api: 'a',
			model: 'm',
			variants: [
				makeConfig('x-0', 'a', 'm', { p: 1, q: 1 }),
				makeConfig('x-1', 'a', 'm', { p: 2, q: 1 }),
				makeConfig('x-2', 'a', 'm', { p: 2, q: 1 }),
			],
		}

		expect(pickVariant(resource, 0, 'p', 2)).toBe(1)
	})

	it('stays on the only variant of a single resource', () => {
		const [single] = groupDiscoveries([loneIndexed])

		expect(pickVariant(single!, 0, 'video_path', 'v')).toBe(0)
	})
})
