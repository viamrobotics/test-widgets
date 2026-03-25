import type { ComponentProps } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../set-power.svelte'

describe('Motor SetPower', () => {
	let user: ReturnType<typeof userEvent.setup>
	let setPower: (power: number) => void

	beforeEach(() => {
		user = userEvent.setup()
		setPower = vi.fn()
	})

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
		render(Subject, {
			setPower,
			...props,
		})

	it('calls setPower with the correct power value when Execute button is clicked', async () => {
		renderSubject({})

		const numericInput = screen.getByRole('spinbutton')
		await user.clear(numericInput)
		await user.type(numericInput, '0.5')

		const executeButton = screen.getByRole('button', { name: /execute/iu })
		await user.click(executeButton)

		expect(setPower).toHaveBeenCalledWith(0.5)
	})
})
