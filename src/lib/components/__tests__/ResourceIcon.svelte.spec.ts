import { mdiCheck } from '@mdi/js'
import { render } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'

import ResourceIcon from '../ResourceIcon.svelte'

const getPaths = (container: HTMLElement) =>
	[...container.querySelectorAll('path')].map((path) => path.getAttribute('d'))

describe('<ResourceIcon>', () => {
	it('Draws distinct glyphs for components and services', () => {
		const component = getPaths(render(ResourceIcon, { props: { type: 'component' } }).container)
		const service = getPaths(render(ResourceIcon, { props: { type: 'service' } }).container)

		expect(component.length).toBeGreaterThan(0)
		expect(service.length).toBeGreaterThan(0)
		expect(component).not.toEqual(service)
		expect(component).not.toContain(mdiCheck)
	})

	it('Draws an invisible check placeholder for other types', () => {
		const { container } = render(ResourceIcon, { props: { type: 'other' } })

		expect(getPaths(container)).toEqual([mdiCheck])
		expect(container.querySelector('svg')).toHaveClass('opacity-0')
	})
})
