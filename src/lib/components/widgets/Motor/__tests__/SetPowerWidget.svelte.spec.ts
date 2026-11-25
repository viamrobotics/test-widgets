import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import InWidgetsProvider from '#lib/__tests__/__fixtures__/InWidgetsProvider.svelte'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../SetPowerWidget.svelte'

const state = vi.hoisted((): { mutate: Mock; error: Error | null } => ({
	mutate: vi.fn(),
	error: null,
}))

vi.mock('@viamrobotics/sdk', () => ({
	MotorClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({
		mutateAsync: state.mutate,
		isPending: false,
		get error() {
			return state.error
		},
	})),
}))

const renderSubject = () =>
	render(InWidgetsProvider, {
		props: { component: Subject, props: { partID: 'test-part', resourceName: 'test-motor' } },
	})

describe('Motor SetPower widget', () => {
	beforeEach(() => {
		state.mutate = vi.fn()
		state.error = null
	})

	it('renders the SetPower section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'SetPower' })).toBeInTheDocument()
	})

	it('calls the setPower mutation when the form is submitted', async () => {
		renderSubject()

		const numericInput = screen.getByRole('spinbutton')
		await userEvent.clear(numericInput)
		await userEvent.type(numericInput, '0.75')
		await userEvent.click(screen.getByRole('button', { name: /execute/iu }))

		expect(state.mutate).toHaveBeenCalledWith([0.75])
	})

	it("shows the mutation error in the section's error indicator", () => {
		state.error = new Error('motor refused to move')

		renderSubject()

		expect(
			screen.getByRole('button', { name: 'SetPower: 1 error, copy to clipboard' })
		).toBeInTheDocument()
	})
})
