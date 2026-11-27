import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../DoCommand.svelte'
import Pane from './__fixtures__/In320Pane.svelte'

const state = vi.hoisted(() => ({
	mutateAsync: vi.fn(),
	isPending: false,
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	useRobotClient: vi.fn(() => ({ current: undefined })),
	useConnectionStatus: vi.fn(() => ({ current: undefined })),
	createResourceMutation: vi.fn(() => ({
		mutateAsync: state.mutateAsync,
		get isPending() {
			return state.isPending
		},
	})),
}))

const arm = { namespace: 'rdk', type: 'component', subtype: 'arm', name: 'my-arm' }

const indicator = () => screen.getByRole('button', { name: /error/u })

describe('DoCommand', () => {
	beforeEach(() => {
		state.mutateAsync = vi.fn()
		state.isPending = false
		localStorage.clear()
	})

	it('sends a failed command to the section indicator, not inline', async () => {
		state.mutateAsync.mockRejectedValue(new Error('command refused'))
		render(Subject, { partID: 'part-id', resource: arm })

		await userEvent.click(screen.getByRole('button', { name: 'Execute' }))

		await expect.poll(() => indicator().getAttribute('aria-label')).toMatch(/1 error/u)
		expect(screen.queryByRole('button', { name: 'Copy error' })).not.toBeInTheDocument()
	})

	it('says the command failed', async () => {
		state.mutateAsync.mockRejectedValue(new Error('command refused'))
		render(Subject, { partID: 'part-id', resource: arm })

		await userEvent.click(screen.getByRole('button', { name: 'Execute' }))

		await expect
			.poll(() => screen.getByTestId('status-line').textContent.trim())
			.toBe('Execute failed')
	})

	it('holds Execute back and drops a press while a command is in flight', async () => {
		state.isPending = true
		render(Subject, { partID: 'part-id', resource: arm })

		const execute = screen.getByRole('button', { name: 'Execute' })
		await userEvent.click(execute)

		expect(execute).toHaveAccessibleDescription('Wait for the command in flight to finish.')
		expect(state.mutateAsync).not.toHaveBeenCalled()
	})

	it('clears the indicator when the command succeeds', async () => {
		state.mutateAsync.mockRejectedValueOnce(new Error('command refused'))
		state.mutateAsync.mockResolvedValueOnce({})
		render(Subject, { partID: 'part-id', resource: arm })

		await userEvent.click(screen.getByRole('button', { name: 'Execute' }))
		await expect.poll(() => indicator().getAttribute('aria-label')).toMatch(/1 error/u)
		await userEvent.click(screen.getByRole('button', { name: 'Execute' }))

		await expect.poll(() => indicator().getAttribute('aria-label')).toBe('DoCommand: No errors')
	})

	it('keeps the last output when a later command fails', async () => {
		state.mutateAsync.mockResolvedValueOnce({ answer: 'forty-two' })
		state.mutateAsync.mockRejectedValueOnce(new Error('command refused'))
		render(Subject, { partID: 'part-id', resource: arm })

		await userEvent.click(screen.getByRole('button', { name: 'Execute' }))
		await expect.poll(() => document.body.textContent).toContain('forty-two')
		await userEvent.click(screen.getByRole('button', { name: 'Execute' }))

		await expect.poll(() => indicator().getAttribute('aria-label')).toMatch(/1 error/u)
		expect(document.body.textContent).toContain('forty-two')
	})

	it('marks the input invalid and reports the parse failure on Execute', async () => {
		render(Subject, { partID: 'part-id', resource: arm, input: '{ not json' })

		expect(screen.getByRole('textbox', { name: 'Input' })).toHaveAttribute('aria-invalid', 'true')
		expect(screen.getByRole('button', { name: 'Input is not valid JSON' })).toBeInTheDocument()

		await userEvent.click(screen.getByRole('button', { name: 'Execute' }))

		await expect.poll(() => indicator().getAttribute('aria-label')).toMatch(/1 error/u)
		expect(state.mutateAsync).not.toHaveBeenCalled()
		await expect
			.poll(() => screen.getByTestId('status-line').textContent.trim())
			.toBe('Execute failed')
	})

	it('leaves valid JSON input unmarked', () => {
		render(Subject, { partID: 'part-id', resource: arm, input: '{"a": 1}' })

		expect(screen.getByRole('textbox', { name: 'Input' })).not.toHaveAttribute('aria-invalid')
		expect(
			screen.queryByRole('button', { name: 'Input is not valid JSON' })
		).not.toBeInTheDocument()
	})

	it('explains that an unsupported resource has no DoCommand in the UI', () => {
		render(Subject, {
			partID: 'part-id',
			resource: { namespace: 'rdk', type: 'component', subtype: 'not-a-subtype', name: 'x' },
		})

		expect(screen.getByText(/is not supported in the UI/u)).toBeInTheDocument()
	})

	it('keeps the root and the pane within 320 px', () => {
		const { container } = render(Pane)

		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild ?? container
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})
})
