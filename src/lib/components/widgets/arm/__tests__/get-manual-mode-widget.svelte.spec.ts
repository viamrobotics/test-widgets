import { render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../get-manual-mode-widget.svelte'

vi.mock('@viamrobotics/sdk', () => ({
	ArmClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		data: undefined,
		isLoading: true,
		isError: false,
		error: null,
	})),
}))

const mockManualMode = (manualMode: boolean) => {
	vi.mocked(createResourceQuery).mockReturnValue({
		data: manualMode,
		isLoading: false,
		isSuccess: true,
		isError: false,
		error: null,
	} as never)
}

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-arm' },
	})

describe('Arm GetManualMode widget', () => {
	it('shows the Enabled pill in a GetManualMode section while manual mode is on', () => {
		mockManualMode(true)

		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetManualMode' })).toBeInTheDocument()
		expect(screen.getByText('Enabled')).toBeInTheDocument()
		expect(screen.queryByText('Disabled')).not.toBeInTheDocument()
	})

	it('shows the Disabled pill while manual mode is off', () => {
		mockManualMode(false)

		renderSubject()

		expect(screen.getByText('Disabled')).toBeInTheDocument()
		expect(screen.queryByText('Enabled')).not.toBeInTheDocument()
	})

	it('polls getManualMode twice a second', () => {
		mockManualMode(false)

		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getManualMode', {
			refetchInterval: 500,
		})
	})
})
