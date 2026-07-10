import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'

import Subject from '../readings-list.svelte'

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
		expect(terms[0]).toHaveTextContent('a')
		expect(terms[1]).toHaveTextContent('b')
		expect(nestedObj).toBeInTheDocument()
	})

	it('shows well-known units for standard reading keys', () => {
		const data = { distance: 1.5 }

		render(Subject, { data })
		expect(screen.getByText('m')).toBeInTheDocument()
	})

	it('shows caller-provided units via the units prop', () => {
		const data = { temperature: 22.5 }

		render(Subject, { data, units: { temperature: '°C' } })
		expect(screen.getByText('°C')).toBeInTheDocument()
	})

	it('prefers caller-provided units over well-known units', () => {
		const data = { distance: 100 }

		render(Subject, { data, units: { distance: 'cm' } })
		expect(screen.getByText('cm')).toBeInTheDocument()
		expect(screen.queryByText('m')).not.toBeInTheDocument()
	})

	it('does not show units for unknown reading keys', () => {
		const data = { gizmos: 8 }

		const { container } = render(Subject, { data })
		const dd = container.querySelector('dd')
		expect(dd?.textContent?.trim()).toBe('8')
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
