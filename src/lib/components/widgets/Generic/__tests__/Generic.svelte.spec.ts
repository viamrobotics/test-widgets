import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import Pane from './__fixtures__/In320Pane.svelte'

const state = vi.hoisted(() => ({ mutateAsync: vi.fn() }))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	useRobotClient: vi.fn(() => ({ current: undefined })),
	useConnectionStatus: vi.fn(() => ({ current: undefined })),
	createResourceMutation: vi.fn(() => ({
		mutateAsync: state.mutateAsync,
		isPending: false,
		error: null,
	})),
}))

describe('Generic widget', () => {
	it('renders the DoCommand heading over the editors', () => {
		render(Pane)

		expect(screen.getByRole('heading', { name: 'DoCommand' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Execute' })).toBeInTheDocument()
	})

	it('shows an error once, in its own heading row', async () => {
		state.mutateAsync.mockRejectedValue(new Error('command refused'))
		render(Pane)

		await userEvent.click(screen.getByRole('button', { name: 'Execute' }))

		const indicators = await screen.findAllByRole('button', { name: /1 error/u })
		expect(indicators).toHaveLength(1)
		const heading = screen.getByRole('heading', { name: 'DoCommand' })
		expect(heading.parentElement).toContainElement(indicators[0] ?? null)
	})

	it('keeps the root and the pane within 320 px', () => {
		const { container } = render(Pane)

		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild ?? container
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})
})
