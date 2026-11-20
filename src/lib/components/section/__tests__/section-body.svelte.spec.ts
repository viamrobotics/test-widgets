import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'

import Subject from './section-body.spec.svelte'

describe('<Section.Body skeleton>', () => {
	it('keeps the children mounted and marks itself busy during the first load', () => {
		render(Subject, { isLoading: true, skeleton: true })

		expect(screen.getByText(/Position/u)).toBeInTheDocument()
		expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
		expect(screen.getByText(/Position/u).parentElement).toHaveAttribute('aria-busy', 'true')
	})
})

describe('<Section.Body> without skeleton', () => {
	it('swaps the children for a progress bar during the first load', () => {
		render(Subject, { isLoading: true, skeleton: false })

		expect(screen.getByRole('progressbar')).toBeInTheDocument()
		expect(screen.queryByText(/Position/u)).not.toBeInTheDocument()
	})
})
