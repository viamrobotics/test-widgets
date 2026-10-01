import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import Subject from './boundary-error.spec.svelte'

describe('<Boundary>', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
	})

	it('shows an error fallback when a child throws', () => {
		render(Subject)

		expect(screen.getByText(/something went wrong/iu)).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /show error/iu })).toBeInTheDocument()
	})

	it('reveals the error and sets aria-expanded when "Show error" is clicked', async () => {
		render(Subject)

		const toggle = screen.getByRole('button', { name: /show error/iu })
		expect(toggle).toHaveAttribute('aria-expanded', 'false')

		await user.click(toggle)

		const hideToggle = screen.getByRole('button', { name: /hide error/iu })
		expect(hideToggle).toHaveAttribute('aria-expanded', 'true')
		expect(screen.getByText(/test error/u)).toBeInTheDocument()
	})

	it('remounts children when "Try again" is clicked', async () => {
		render(Subject)

		await user.click(screen.getByRole('button', { name: 'Try again' }))

		expect(screen.getByText(/something went wrong/iu)).toBeInTheDocument()
	})
})
