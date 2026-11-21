import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'

import Subject from '../history-line.svelte'

const renderPoints = (samples: number[], capacity = 5) => {
	render(Subject, { props: { samples, capacity } })
	return screen.getByTestId('history-line-polyline').getAttribute('points') ?? ''
}

describe('HistoryLine', () => {
	it('draws no points for an empty run', () => {
		expect(renderPoints([])).toBe('')
	})

	it('draws one finite point at the left for a single sample', () => {
		const points = renderPoints([4])

		expect(points).not.toContain('NaN')
		expect(points.startsWith('0,')).toBe(true)
		expect(points.split(' ')).toHaveLength(1)
	})

	it('draws a flat run on one horizontal line', () => {
		const points = renderPoints([3, 3, 3])

		expect(points).not.toContain('NaN')
		expect(new Set(points.split(' ').map((point) => point.split(',')[1])).size).toBe(1)
	})

	it('scales a varied run to its own range, left to right', () => {
		const points = renderPoints([1, 5, 3], 3)
			.split(' ')
			.map((point) => point.split(',').map(Number))

		expect(points.flat().some((value) => Number.isNaN(value))).toBe(false)
		expect(points.map(([x]) => x)).toEqual([0, 50, 100])
		const [first, second] = points
		expect(second?.[1]).toBeLessThan(first?.[1] ?? 0)
	})

	it('is hidden from assistive technology', () => {
		render(Subject, { props: { samples: [1, 2], capacity: 5 } })

		expect(screen.getByTestId('history-line-polyline').closest('svg')).toHaveAttribute(
			'aria-hidden',
			'true'
		)
	})
})
