import type { ComponentProps } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../move-straight.svelte'

describe('Base MoveStraight', () => {
	let user: ReturnType<typeof userEvent.setup>
	let moveStraight: (distanceMm: number, mmPerSec: number) => void

	beforeEach(() => {
		user = userEvent.setup()
		moveStraight = vi.fn()
	})

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
		render(Subject, {
			moveStraight,
			...props,
		})

	it('calls moveStraight with the correct default values', async () => {
		renderSubject({})

		const executeButton = screen.getByRole('button', { name: /execute/iu })
		await user.click(executeButton)

		expect(moveStraight).toHaveBeenCalledWith(200, 100)
	})

	it('calls moveStraight with the correct distanceMm and mmPerSec values when Execute button is clicked', async () => {
		renderSubject({})

		const distanceInput = screen.getByRole('spinbutton', {
			name: /^distance/iu,
		})
		await user.clear(distanceInput)
		await user.type(distanceInput, '151')

		const speedInput = screen.getByRole('spinbutton', { name: /^speed/iu })
		await user.clear(speedInput)
		await user.type(speedInput, '-10')

		const executeButton = screen.getByRole('button', { name: /execute/iu })
		await user.click(executeButton)

		expect(moveStraight).toHaveBeenCalledWith(151, -10)
	})
})
