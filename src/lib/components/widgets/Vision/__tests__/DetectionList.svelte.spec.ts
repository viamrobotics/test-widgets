import { render, screen, within } from '@testing-library/svelte'
import { Detection } from '@viamrobotics/sdk'
import { describe, expect, it } from 'vitest'

import Subject from '../DetectionList.svelte'

const PERSON = new Detection({
	xMin: 112n,
	yMin: 64n,
	xMax: 298n,
	yMax: 410n,
	confidence: 0.924,
	className: 'person',
})

const DOG = new Detection({
	xMin: 205n,
	yMin: 260n,
	xMax: 330n,
	yMax: 400n,
	confidence: 0.768,
	className: 'dog',
})

const UNBOXED = new Detection({ confidence: 0.5, className: 'cloud' })

describe('DetectionList', () => {
	it('draws one row per detection', () => {
		render(Subject, { props: { detections: [PERSON, DOG] } })

		const rows = within(screen.getByRole('list', { name: 'Detections' })).getAllByRole('listitem')

		expect(rows.map((row) => row.textContent?.replaceAll(/\s+/g, ' ').trim())).toEqual([
			'person 92.40 % (112, 64) to (298, 410)',
			'dog 76.80 % (205, 260) to (330, 400)',
		])
	})

	it('names each confidence readout by its class name', () => {
		render(Subject, { props: { detections: [PERSON] } })

		expect(screen.getByRole('group', { name: 'person' })).toHaveTextContent('92.40 %')
	})

	it('draws no box line for a detection without a pixel box', () => {
		render(Subject, { props: { detections: [UNBOXED] } })

		expect(screen.getByRole('listitem')).toHaveTextContent('cloud 50.00 %')
	})

	it('reads - when there are no detections', () => {
		render(Subject, { props: { detections: [] } })

		expect(screen.getByRole('group', { name: 'Detections' })).toHaveTextContent('Detections -')
		expect(screen.queryByRole('list')).not.toBeInTheDocument()
	})
})
