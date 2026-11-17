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

		const numericInput = screen.getByRole('spinbutton', { name: 'Power' })
		await user.clear(numericInput)
		await user.type(numericInput, '-0.3')

		const executeButton = screen.getByRole('button', { name: /execute/iu })
		await user.click(executeButton)

		expect(setPower).toHaveBeenCalledWith(-0.3)
	})

	it('describes the power field with its hint', () => {
		renderSubject({})

		expect(screen.getByRole('spinbutton', { name: 'Power' })).toHaveAccessibleDescription(
			/in the range of –1\.0 to 1\.0/u
		)
		expect(screen.getByRole('button', { name: 'About Power' })).toBeInTheDocument()
	})

	const scrubPowerLabelLeftByFourPixels = async () => {
		const label = screen.getByText('Power', { selector: 'label' })
		await user.pointer([
			{ keys: '[MouseLeft>]', target: label, coords: { clientX: 100, clientY: 10 } },
			{ target: label, coords: { clientX: 98, clientY: 10 } },
			{ target: label, coords: { clientX: 96, clientY: 10 } },
			{ keys: '[/MouseLeft]', target: label, coords: { clientX: 96, clientY: 10 } },
		])
	}

	it('moves only the field, without calling setPower, while the label is scrubbed', async () => {
		renderSubject({})

		await scrubPowerLabelLeftByFourPixels()

		expect(
			screen.getByRole('spinbutton', { name: 'Power' }),
			'4 px left at step 0.1 takes 0.5 to 0.1'
		).toHaveValue(0.1)
		expect(setPower).not.toHaveBeenCalled()
	})

	it('sends the scrubbed power on Execute', async () => {
		renderSubject({})
		await scrubPowerLabelLeftByFourPixels()

		await user.click(screen.getByRole('button', { name: /execute/iu }))

		expect(setPower).toHaveBeenCalledExactlyOnceWith(expect.closeTo(0.1, 5))
	})

	it.each(['1.5', '-2'])('does not send a typed power of %s, outside -1 to 1', async (typed) => {
		renderSubject({})

		const numericInput = screen.getByRole('spinbutton', { name: 'Power' })
		await user.clear(numericInput)
		await user.type(numericInput, typed)

		expect(numericInput).toHaveAttribute('aria-invalid', 'true')

		const executeButton = screen.getByRole('button', { name: /execute/iu })
		expect(executeButton).toBeDisabled()
		await user.click(executeButton)

		expect(setPower).not.toHaveBeenCalled()
	})

	it('does not send an empty power', async () => {
		renderSubject({})

		const numericInput = screen.getByRole('spinbutton', { name: 'Power' })
		await user.clear(numericInput)

		expect(numericInput).toHaveAttribute('aria-invalid', 'true')
		await user.click(screen.getByRole('button', { name: /execute/iu }))

		expect(setPower).not.toHaveBeenCalled()
	})
})
