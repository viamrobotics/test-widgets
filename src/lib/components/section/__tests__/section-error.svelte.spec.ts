import { mdiCheck, mdiContentCopy } from '@mdi/js'
import { render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import SectionError from '../section-error.svelte'
import Subject from './section-error.spec.svelte'

const notPowered = () => {
	const error = new Error('gripper is not powered')
	error.name = 'RpcError'
	return error
}

const indicator = (name: string) => screen.getByRole('button', { name })

// The inline line outside a section. The indicator's tooltip also renders the error text, so the
// line is told apart by its copy button.
const inlineLine = () => screen.queryByRole('button', { name: 'Copy error' })

describe('<Section.Error>', () => {
	it("adds an inner form's error to the section's indicator instead of rendering it inline", () => {
		render(Subject, { error: notPowered() })

		expect(indicator('Open: 1 error, copy to clipboard')).toBeInTheDocument()
		expect(inlineLine()).not.toBeInTheDocument()
	})

	it('clears from the indicator when the error clears', async () => {
		const { rerender } = render(Subject, { error: notPowered() })

		await rerender({ error: null })

		expect(indicator('Open: No errors')).toBeInTheDocument()
	})

	it('clears from the indicator when the form unmounts', async () => {
		const { rerender } = render(Subject, { error: notPowered() })

		await rerender({ error: notPowered(), showForm: false })

		expect(indicator('Open: No errors')).toBeInTheDocument()
	})

	it("counts once when the section's own mutation fails the same way", () => {
		render(Subject, { error: notPowered(), mutationError: notPowered() })

		expect(indicator('Open: 1 error, copy to clipboard')).toBeInTheDocument()
	})

	it('renders the error inline outside a section', () => {
		render(SectionError, { error: notPowered() })

		expect(screen.getByText('RpcError: gripper is not powered')).toBeInTheDocument()
		expect(inlineLine()).toBeInTheDocument()
	})

	it.each([
		{ label: 'null', error: null },
		{ label: 'undefined', error: undefined },
	])('renders nothing outside a section when the error is $label', ({ error }) => {
		render(SectionError, { error })

		expect(inlineLine()).not.toBeInTheDocument()
	})

	it('gives the inline line the id it was passed', () => {
		render(SectionError, { error: notPowered(), id: 'do-command-output' })

		expect(screen.getByText('RpcError: gripper is not powered')).toHaveAttribute(
			'id',
			'do-command-output'
		)
	})

	it('copies the inline error text to the clipboard', async () => {
		const user = userEvent.setup()
		const writeText = vi.fn().mockResolvedValue(undefined)
		vi.stubGlobal('navigator', { clipboard: { writeText } })
		render(SectionError, { error: notPowered() })

		await user.click(screen.getByRole('button', { name: 'Copy error' }))

		expect(writeText).toHaveBeenCalledWith('RpcError: gripper is not powered')
	})

	it('shows a check after a copy, then restores the copy icon', async () => {
		vi.useFakeTimers()
		const timerUser = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })
		vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
		render(SectionError, { error: notPowered() })

		await timerUser.click(screen.getByRole('button', { name: 'Copy error' }))

		const iconPath = () =>
			screen.getByRole('button', { name: 'Copy error' }).querySelector('path')?.getAttribute('d')
		await waitFor(() => expect(iconPath()).toBe(mdiCheck))
		vi.runAllTimers()
		await waitFor(() => expect(iconPath()).toBe(mdiContentCopy))
		vi.useRealTimers()
	})
})
