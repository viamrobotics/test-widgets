import '../../../../../app.css'
import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../object-point-clouds.svelte'
import {
	objectWithBoxAndSphere,
	objectWithMissingValues,
} from './__fixtures__/object-point-clouds.ts'

const renderSubject = () =>
	render(Subject, { props: { objects: [objectWithBoxAndSphere, objectWithMissingValues] } })

const renderFramed = () =>
	render(Subject, {
		props: { objects: [objectWithBoxAndSphere, objectWithMissingValues], isFramed: true },
	})

const nextSavedBlob = () =>
	new Promise<Blob>((resolve) => {
		const blobsByUrl = new Map<string, Blob>()
		const createObjectURL = URL.createObjectURL.bind(URL)
		vi.spyOn(URL, 'createObjectURL').mockImplementation((object) => {
			const url = createObjectURL(object)
			if (object instanceof Blob) blobsByUrl.set(url, object)
			return url
		})
		vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
			this: HTMLAnchorElement
		) {
			const blob = blobsByUrl.get(this.href)
			if (blob) resolve(blob)
		})
	})

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

	it('renders no frame or Screenshot unless framed', () => {
		renderSubject()

		expect(screen.queryByRole('button', { name: 'Screenshot' })).not.toBeInTheDocument()
		expect(screen.queryByRole('heading', { name: 'Object 1' })).not.toBeInTheDocument()
	})

	it('frames each view under its own heading when framed', async () => {
		renderFramed()

		const second = screen.getByRole('region', { name: 'Object 2' })
		const frameGroup = within(second).getByRole('group', { name: 'Object 2 point cloud' })
		expect(within(frameGroup).getByTestId('object-point-cloud-cell')).toBeInTheDocument()
		expect(
			await within(frameGroup).findByRole('button', { name: 'Screenshot' })
		).toBeInTheDocument()
	})

	it('saves a PNG of only its own view from Screenshot', async () => {
		const { container } = renderFramed()
		const root = container.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('no root')
		root.style.width = '400px'
		const saved = nextSavedBlob()
		const first = screen.getByRole('region', { name: 'Object 1' })
		const cell = within(first).getByTestId('object-point-cloud-cell')
		const screenshotButton = await within(first).findByRole('button', { name: 'Screenshot' })

		await userEvent.click(screenshotButton)

		const blob = await saved
		expect(blob.type).toBe('image/png')
		const bitmap = await createImageBitmap(blob)
		expect(bitmap.width).toBe(Math.round(cell.getBoundingClientRect().width * devicePixelRatio))
		expect(bitmap.height, 'the capture is the cell, not the whole shared canvas').toBe(
			Math.round(cell.getBoundingClientRect().height * devicePixelRatio)
		)
	})
})
