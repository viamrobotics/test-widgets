import { getDefaultNormalizer, render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import Subject from './BoundaryError.spec.svelte'

const keepLineBreaks = getDefaultNormalizer({ collapseWhitespace: false })

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

	it.each([
		{
			shape: 'a Firefox or Safari stack, which holds only the call frames',
			stack:
				'throwError@http://localhost/boundary-error.spec.svelte:11:9\n@http://localhost/boundary-error.spec.svelte:16:25',
			shown:
				'Error: test error\nthrowError@http://localhost/boundary-error.spec.svelte:11:9\n@http://localhost/boundary-error.spec.svelte:16:25',
		},
		{
			shape: 'a Chromium stack, which already opens with the message',
			stack:
				'Error: test error\n    at throwError (http://localhost/boundary-error.spec.svelte:11:9)',
			shown:
				'Error: test error\n    at throwError (http://localhost/boundary-error.spec.svelte:11:9)',
		},
		{ shape: 'an error with no stack', stack: undefined, shown: 'Error: test error' },
	])('shows the message once for $shape', async ({ stack, shown }) => {
		render(Subject, { error: Object.assign(new Error('test error'), { stack }) })

		await user.click(screen.getByRole('button', { name: /show error/iu }))

		expect(screen.getByText(shown, { normalizer: keepLineBreaks })).toBeInTheDocument()
	})

	it('remounts children when "Try again" is clicked', async () => {
		render(Subject)

		await user.click(screen.getByRole('button', { name: 'Try again' }))

		expect(screen.getByText(/something went wrong/iu)).toBeInTheDocument()
	})
})
