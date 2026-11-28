import type { ComponentProps } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../AnalogWrite.svelte'

const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
	render(Subject, {
		setValue: vi.fn(async () => true),
		...props,
	})

describe('Board Analog Write', () => {
	it('calls setValue with the typed value', async () => {
		const user = userEvent.setup()
		const setValue = vi.fn(async () => true)
		renderSubject({ setValue })

		const value = screen.getByRole('spinbutton', { name: 'Value' })
		await user.clear(value)
		await user.type(value, '129')
		await user.click(screen.getByRole('button', { name: 'Set' }))

		expect(setValue).toHaveBeenCalledWith(129)
	})

	it('starts Value at 0 in whole steps', () => {
		renderSubject({})

		const value = screen.getByRole('spinbutton', { name: 'Value' })
		expect(value).toHaveValue(0)
		expect(value).toHaveAttribute('step', '1')
	})
})
