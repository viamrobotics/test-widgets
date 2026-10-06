import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'

import Subject from './section-body.spec.svelte'

const loadingBar = () => screen.queryByTestId('section-placeholder-loading')

describe('<Section.Body skeleton>', () => {
	it('keeps the children mounted and marks itself busy during the first load', () => {
		render(Subject, { isLoading: true, skeleton: true })

		expect(screen.getByText(/Position/u)).toBeInTheDocument()
		expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
		expect(screen.getByText(/Position/u).parentElement).toHaveAttribute('aria-busy', 'true')
	})

	it('pulses the placeholder and disables controls during the first load', () => {
		render(Subject, { isLoading: true, skeleton: true })

		expect(loadingBar()).toBeInTheDocument()
		expect(screen.queryByText('No data')).not.toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Execute' })).toBeDisabled()
	})

	it('reads "No data" and enables controls once the first load is over', async () => {
		const { rerender } = render(Subject, { isLoading: true, skeleton: true })

		await rerender({ isLoading: false, skeleton: true })

		expect(loadingBar()).not.toBeInTheDocument()
		expect(screen.getByText('No data')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Execute' })).toBeEnabled()
		expect(screen.getByText(/Position/u).parentElement).toHaveAttribute('aria-busy', 'false')
	})
})

describe('<Section.Body> without skeleton', () => {
	it('swaps the children for a progress bar during the first load', () => {
		render(Subject, { isLoading: true, skeleton: false })

		expect(screen.getByRole('progressbar')).toBeInTheDocument()
		expect(screen.queryByText(/Position/u)).not.toBeInTheDocument()
	})
})
