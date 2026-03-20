import type { ComponentProps } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../set-rpm.svelte'

describe('MotorView SetRPM', () => {
	let user: ReturnType<typeof userEvent.setup>
	let setRPM: (rpm: number) => void

	beforeEach(() => {
		user = userEvent.setup()
		setRPM = vi.fn()
	})

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
		render(Subject, {
			setRPM,
			...props,
		})

	it('has a labeled form for RPM', () => {
		renderSubject({})

		const numericInput = screen.getByRole('spinbutton')
		expect(numericInput).toHaveAccessibleName(/RPM/u)
	})

	it('calls setRPM when Execute is clicked', async () => {
		renderSubject({})

		const numericInput = screen.getByRole('spinbutton')
		await user.clear(numericInput)
		await user.type(numericInput, '120')

		const executeButton = screen.getByRole('button', { name: /execute/iu })
		await user.click(executeButton)

		expect(setRPM).toHaveBeenCalledWith(120)
	})
})
