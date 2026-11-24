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
			...props,
		})

	const angleField = () => screen.getByRole('spinbutton', { name: /desired angle/iu })
	const restoreButton = () => screen.getByRole('button', { name: /reset desired angle/iu })
	const queryRestoreButton = () => screen.queryByRole('button', { name: /reset desired angle/iu })

	it('draws no Quick set buttons', () => {
		renderSubject({ currentPosition: 45 })

		expect(screen.queryByRole('button', { name: /zero/iu })).not.toBeInTheDocument()
		expect(screen.queryByRole('button', { name: /^current position$/iu })).not.toBeInTheDocument()
	})

	it('starts the field at the current position, with the restore button hidden', () => {
		renderSubject({ currentPosition: 45 })

		expect(angleField()).toHaveValue(45)
		expect(queryRestoreButton()).not.toBeInTheDocument()
	})

	it('holds an edit while the live position moves, and restores it on the button', async () => {
		const { rerender } = renderSubject({ currentPosition: 45 })

		await user.clear(angleField())
		await user.type(angleField(), '120')
		await rerender({ currentPosition: 50 })

		expect(angleField()).toHaveValue(120)
		expect(restoreButton()).toBeVisible()
		expect(restoreButton()).toHaveAccessibleName('Reset desired angle to 50°')

		await user.click(restoreButton())

		expect(angleField()).toHaveValue(50)
		expect(queryRestoreButton()).not.toBeInTheDocument()
		expect(moveTo).not.toHaveBeenCalled()
	})

	it('calls moveTo with the desired angle when the Execute button is clicked', async () => {
		renderSubject({})

		await user.clear(angleField())
		await user.type(angleField(), '90')
		await user.click(screen.getByRole('button', { name: /execute/iu }))

		expect(moveTo).toHaveBeenCalledWith(90)
	})

	it('puts the field in the error state and disables Execute for a negative angle', async () => {
		renderSubject({})

		await user.clear(angleField())
		await user.type(angleField(), '-1{Tab}')

		expect(angleField()).toBeInvalid()
		expect(screen.getByText(/must be non-negative/iu, { selector: '.sr-only' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /execute/iu })).toBeDisabled()
	})

	it('disables Execute while the field is empty', async () => {
		renderSubject({ currentPosition: 45 })

		await user.clear(angleField())

		expect(screen.getByRole('button', { name: /execute/iu })).toBeDisabled()
	})
})
