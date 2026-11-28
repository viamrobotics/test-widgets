import '../../../app.css'

import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'

import Subject from '../ReadingsList.svelte'

describe('<ReadingsList>', () => {
	it('renders a list of readings', () => {
		const data = {
			gizmos: 8,
			whizzbangs: { enabled: true },
		}

		render(Subject, { data })
		expect(screen.getByRole('term', { name: 'gizmos' })).toBeInTheDocument()
		expect(screen.getByText('8')).toBeInTheDocument()
		expect(screen.getByRole('term', { name: 'whizzbangs' })).toBeInTheDocument()
		expect(screen.getByText(/"enabled": true/iu)).toBeInTheDocument()
	})

	it('sorts nested readings', () => {
		const data = {
			b: 8,
			a: { b: '2', '1': '0', a: '1' },
		}

		render(Subject, { data })
		// note: sorted alphanumerically
		const nestedObj = screen.getByText(/\s*"1": "0",\s*"a": "1",\s*"b": "2"/iu)
		const terms = screen.getAllByRole('term')

		expect(terms).toHaveLength(2)
		expect(terms[0]).toMatchTextContent('a')
		expect(terms[1]).toMatchTextContent('b')
		expect(nestedObj).toBeInTheDocument()
	})

	it('renders nested readings without leading indentation', () => {
		const data = {
			location: { x: 1, y: 2 },
		}

		const { container } = render(Subject, { data })
		// exact match: whitespace between <pre> and <code> is preserved and would fail here
		expect(container.querySelector('pre')?.textContent).toBe('{\n  "x": 1,\n  "y": 2\n}')
	})

	it('renders null readings as plain text rather than a code block', () => {
		const data = {
			nearest_fingerprint: null,
		}

		const { container } = render(Subject, { data })
		expect(screen.getByRole('definition')).toMatchTextContent('null')
		expect(container.querySelector('pre')).toBeNull()
	})

	it('draws the placeholder dash when there are no readings', () => {
		render(Subject, { data: {} })
		expect(screen.getByText('-')).toBeInTheDocument()
		expect(screen.queryByRole('term')).toBeNull()
	})

	it('draws the Copy JSON button by default', () => {
		render(Subject, { data: { a: 1 } })
		expect(screen.getByRole('button', { name: 'Copy JSON' })).toBeInTheDocument()
	})

	it('omits the Copy JSON button when showCopy is false', () => {
		render(Subject, { data: { a: 1 }, showCopy: false })
		expect(screen.queryByRole('button', { name: 'Copy JSON' })).toBeNull()
	})

	it('keeps a long string reading whole and inside a 320 px pane', () => {
		const status = `status ${'overheating-'.repeat(12)}end`
		const { container } = render(Subject, { data: { status }, showCopy: false })
		const pane = document.createElement('div')
		pane.style.width = '320px'
		pane.style.overflowX = 'auto'
		pane.append(...container.childNodes)
		document.body.append(pane)

		const value = screen.getByText(`"${status}"`)

		expect(value).toBeInTheDocument()
		expect(value.scrollWidth).toBeLessThanOrEqual(value.clientWidth)
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
		pane.remove()
	})

	it('renders nested image', () => {
		const data = {
			image:
				'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=',
		}

		render(Subject, { data })
		const image = screen.getByRole('img')
		expect(image).toBeInTheDocument()
		expect(image).toHaveAttribute('src', data.image)
		expect(image).toHaveAttribute('alt', 'image')
	})
})
