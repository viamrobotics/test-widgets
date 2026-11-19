import '../../../../../app.css'
import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'

import Subject from '../object-point-clouds.svelte'
import {
	objectWithBoxAndSphere,
	objectWithMissingValues,
} from './__fixtures__/object-point-clouds.ts'

const renderSubject = () =>
	render(Subject, { props: { objects: [objectWithBoxAndSphere, objectWithMissingValues] } })

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

describe('<ObjectPointClouds>', () => {
	it('renders one folder per geometry with its title', () => {
		renderSubject()

		expect(screen.getByRole('button', { name: 'crate (box)' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'ball (sphere)' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'bare (box)' })).toBeInTheDocument()
		expect(screen.getByText('world')).toBeInTheDocument()
		expect(screen.getByText('base')).toBeInTheDocument()
	})

	it('reads dimensions, position, and rotation with units', () => {
		renderSubject()

		const dimensions = screen.getAllByRole('group', { name: 'Dimensions' })[0]
		expect(dimensions.textContent).toMatch(/1200\.000\s*mm/u)
		expect(dimensions.textContent).toMatch(/800\.000\s*mm/u)
		expect(dimensions.textContent).toMatch(/600\.000\s*mm/u)

		const position = screen.getByRole('group', { name: 'Position' })
		expect(position.textContent).toMatch(/250\.500\s*mm/u)

		const rotation = screen.getByRole('group', { name: 'Rotation' })
		expect(rotation.textContent).toMatch(/45\.000\s*°/u)
	})

	it('reads a missing value as a dash', () => {
		renderSubject()

		const dimensions = screen.getAllByRole('group', { name: 'Dimensions' })
		const missing = dimensions.find((group) => group.textContent?.includes('-'))
		expect(missing).toBeDefined()
		expect(missing).not.toHaveTextContent('000')
	})

	it('keeps each cell square and follows the container width', async () => {
		const { container } = renderSubject()
		const root = container.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('no root')
		root.style.width = '400px'
		await frame()

		const cells = screen.getAllByTestId('object-point-cloud-cell')
		expect(cells).toHaveLength(2)
		const narrow = cells[0]!.getBoundingClientRect()
		expect(narrow.width).toBeGreaterThan(0)
		expect(narrow.height).toBeCloseTo(narrow.width, 0)
		expect(narrow.width).toBeCloseTo(400, 0)

		root.style.width = '800px'
		await frame()
		const wide = cells[0]!.getBoundingClientRect()
		expect(wide.height).toBeCloseTo(wide.width, 0)
		expect(wide.width).toBeLessThan(400)
		expect(wide.width).toBeGreaterThan(300)
	})
})
