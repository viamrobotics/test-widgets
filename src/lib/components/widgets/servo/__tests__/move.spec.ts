import type { ComponentProps } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../move.svelte'

describe('Servo Move', () => {
	let user: ReturnType<typeof userEvent.setup>
	let moveTo: (angle: number) => void

	beforeEach(() => {
		user = userEvent.setup()
		moveTo = vi.fn()
	})

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
		render(Subject, {
			currentPosition: 0,
			moveTo,
			lastError: null,
			...props,
		})

	it('sets the desired angle to zero when the Zero button is clicked', async () => {
		renderSubject({ currentPosition: 45 })

		const zeroButton = screen.getByRole('button', { name: /zero/iu })
		await user.click(zeroButton)

		const numericInput = screen.getByRole('spinbutton')
		expect(numericInput).toHaveValue(0)
	})

	it('sets the desired angle to the current position when the Current position button is clicked', async () => {
		renderSubject({ currentPosition: 45 })

		const currentPositionButton = screen.getByRole('button', {
			name: /current position/iu,
		})
		await user.click(currentPositionButton)

		const numericInput = screen.getByRole('spinbutton')
		expect(numericInput).toHaveValue(45)
	})

	it('calls moveTo with the desired angle when the Execute button is clicked', async () => {
		renderSubject({})

		const numericInput = screen.getByRole('spinbutton')
		await user.clear(numericInput)
		await user.type(numericInput, '90')

		const executeButton = screen.getByRole('button', { name: /execute/iu })
		await user.click(executeButton)

		expect(moveTo).toHaveBeenCalledWith(90)
	})

	it('displays an error when desired angle is negative', async () => {
		renderSubject({})

		const numericInput = screen.getByRole('spinbutton')
		await user.clear(numericInput)
		await user.type(numericInput, '-1{Tab}')

		const warning = screen.getByText(/must be non-negative/iu)
		expect(warning).toBeInTheDocument()
	})

	it('displays the provided error', () => {
		renderSubject({ lastError: new Error('baz error msg') })
		expect(screen.getByText(/baz error msg/iu)).toBeInTheDocument()
	})
})
