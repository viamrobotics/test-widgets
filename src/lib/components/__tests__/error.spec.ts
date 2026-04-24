import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../error.svelte'

describe('<ErrorDisplay>', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
	})

	it('renders error name and message', () => {
		const error = new Error('Something went wrong')
		error.name = 'TestError'

		render(Subject, { lastError: error })
		expect(screen.getByText('TestError: Something went wrong')).toBeInTheDocument()
	})

	it('does not render when lastError is null', () => {
		const { container } = render(Subject, { lastError: null })
		expect(container.querySelector('p')).not.toBeInTheDocument()
	})

	it('does not render when lastError is undefined', () => {
		const { container } = render(Subject, { lastError: undefined })
		expect(container.querySelector('p')).not.toBeInTheDocument()
	})

	it('renders a copy button', () => {
		const error = new Error('Something went wrong')
		render(Subject, { lastError: error })
		expect(screen.getByRole('button', { name: /copy error/iu })).toBeInTheDocument()
	})

	it('copies error text to clipboard when copy button is clicked', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined)
		vi.stubGlobal('navigator', { clipboard: { writeText } })

		const error = new Error('Something went wrong')
		error.name = 'TestError'
		render(Subject, { lastError: error })

		const copyButton = screen.getByRole('button', { name: /copy error/iu })
		await user.click(copyButton)

		expect(writeText).toHaveBeenCalledWith('TestError: Something went wrong')
	})
})
