import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../do-command.svelte'

const state = vi.hoisted(() => ({
	mutateAsync: vi.fn(),
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	useRobotClient: vi.fn(() => ({ current: undefined })),
	useConnectionStatus: vi.fn(() => ({ current: undefined })),
	createResourceMutation: vi.fn(() => ({
		mutateAsync: state.mutateAsync,
		isPending: false,
	})),
}))

const arm = { namespace: 'rdk', type: 'component', subtype: 'arm', name: 'my-arm' }

describe('DoCommand', () => {
	beforeEach(() => {
		state.mutateAsync = vi.fn()
	})

	it('renders a failed command inline, where the input editor points its error id', async () => {
		state.mutateAsync.mockRejectedValue(new Error('command refused'))
		render(Subject, { partID: 'part-id', resource: arm })

		await userEvent.click(screen.getByRole('button', { name: 'Execute' }))

		const line = await screen.findByText(/Error: command refused/u)
		expect(line.id).not.toBe('')
		expect(document.querySelector(`[aria-errormessage="${line.id}"]`)).not.toBeNull()
		expect(screen.getByRole('button', { name: 'Copy error' })).toBeInTheDocument()
	})

	it('clears the error line when the command succeeds', async () => {
		state.mutateAsync.mockRejectedValueOnce(new Error('command refused'))
		state.mutateAsync.mockResolvedValueOnce({})
		render(Subject, { partID: 'part-id', resource: arm })

		await userEvent.click(screen.getByRole('button', { name: 'Execute' }))
		await screen.findByText(/Error: command refused/u)
		await userEvent.click(screen.getByRole('button', { name: 'Execute' }))

		await expect.poll(() => screen.queryByText(/command refused/u)).not.toBeInTheDocument()
	})

	it('explains that an unsupported resource has no DoCommand in the UI', () => {
		render(Subject, {
			partID: 'part-id',
			resource: { namespace: 'rdk', type: 'component', subtype: 'not-a-subtype', name: 'x' },
		})

		expect(screen.getByText(/is not supported in the UI/u)).toBeInTheDocument()
	})
})
