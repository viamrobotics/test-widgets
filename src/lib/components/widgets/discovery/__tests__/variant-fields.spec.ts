import { describe, expect, it } from 'vitest'

import { groupDiscoveries } from '../group-discoveries'
import { variantFields } from '../variant-fields'
import { loneIndexed, webcamModes } from './__fixtures__/discoveries-config'

describe('variantFields', () => {
	const [webcam] = groupDiscoveries(webcamModes)

	it('lists every value of every control in first-seen order', () => {
		const fields = variantFields(webcam!)
		const byKey = Object.fromEntries(fields.map((field) => [field.key, field]))

		expect(byKey.width_px).toMatchObject({ values: [640, 1280], isControl: true })
		expect(byKey.height_px).toMatchObject({ values: [480, 720], isControl: true })
		expect(byKey.frame_rate).toMatchObject({ values: [30, 60], isControl: true })
	})

	it('marks a value shared by every variant as a readout', () => {
		const field = variantFields(webcam!).find((entry) => entry.key === 'video_path')

		expect(field).toEqual({ key: 'video_path', values: ['video0'], isControl: false })
	})

	it('gives a single-variant resource no controls', () => {
		const [single] = groupDiscoveries([loneIndexed])
		const fields = variantFields(single!)

		expect(fields).toHaveLength(1)
		expect(fields.some((field) => field.isControl)).toBe(false)
	})
})
