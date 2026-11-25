import { render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../is-moving-widget.svelte'

const { queryState } = vi.hoisted(() => {
	const state: { data: boolean | undefined } = { data: undefined }
	return { queryState: state }
})

vi.mock('@viamrobotics/sdk', () => ({
	MotorClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		data: queryState.data,
		isLoading: queryState.data === undefined,
		isSuccess: queryState.data !== undefined,
		isError: false,
		error: null,
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-motor' },
	})

describe('Motor IsMoving widget', () => {
	beforeEach(() => {
		queryState.data = undefined
		vi.mocked(createResourceQuery).mockClear()
	})

	it('renders the IsMoving section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'IsMoving' })).toBeInTheDocument()
	})

	it('shows the compact Moving badge while the motor reports motion', () => {
		queryState.data = true

		renderSubject()

		expect(screen.getByText('Moving')).toHaveClass('badge', 'badge-success')
	})

	it('shows the compact Idle badge while the motor reports no motion', () => {
		queryState.data = false

		renderSubject()

		expect(screen.getByText('Idle')).toHaveClass('badge', 'badge-neutral')
	})

	it('keeps the update hint out of the body until the badge is focused', () => {
		queryState.data = true

		renderSubject()

		expect(screen.queryByText('Updates automatically')).not.toBeInTheDocument()
	})

	it('shows the update hint in a tooltip when the badge takes keyboard focus', async () => {
		queryState.data = true
		renderSubject()
		const badge = screen.getByText('Moving')

		badge.focus()

		expect(badge, 'the badge must be focusable for keyboard users').toHaveFocus()
		expect(
			await screen.findByRole('tooltip', { name: 'Updates automatically' })
		).toBeInTheDocument()
	})

	it('polls isMoving every 500 ms', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'isMoving', {
			refetchInterval: 500,
		})
	})
})
