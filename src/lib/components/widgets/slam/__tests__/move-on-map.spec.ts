import type { ComponentProps } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../move-on-map.svelte'

describe('SlamView move on map', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
	})

	const updateDestination = vi.fn()
	const moveOnMap = vi.fn()
	const stopPlan = vi.fn()

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
		render(Subject, {
			destination: undefined,
			updateDestination,
			moveOnMap,
			stopPlan,
			lastError: null,
			...props,
		})

	it('disables the execute button for missing destination', async () => {
		renderSubject({})

		const executeButton = screen.getByRole('button', { name: /execute/iu })

		expect(executeButton).toHaveAttribute('aria-disabled')

		await user.click(executeButton)

		expect(moveOnMap).not.toHaveBeenCalled()
	})

	it('sets the destination', async () => {
		renderSubject({})

		const xInput = screen.getByRole('spinbutton', { name: /x/iu })
		const yInput = screen.getByRole('spinbutton', { name: /y/iu })

		await user.type(xInput, '100')
		await user.type(yInput, '200')
		// Remove focus from the yInput so the change event occurs
		await user.click(xInput)

		expect(updateDestination).toHaveBeenCalledWith({ x: 100 })
		expect(updateDestination).toHaveBeenCalledWith({ y: 200 })
	})

	it('moves on map', async () => {
		renderSubject({
			destination: {
				x: 1,
				y: 2,
				z: 3,
			},
		})

		const planDeviationInput = screen.getByRole('spinbutton', {
			name: /plan deviation/iu,
		})
		const executeButton = screen.getByRole('button', { name: /execute/iu })

		await user.type(planDeviationInput, '4')
		await user.click(executeButton)

		expect(moveOnMap).toHaveBeenCalledOnce()
		expect(moveOnMap).toHaveBeenCalledWith(4)
	})

	it('stops the plan', async () => {
		renderSubject({})

		const stopButton = screen.getByRole('button', { name: /stop/iu })

		await user.click(stopButton)

		expect(stopPlan).toHaveBeenCalledOnce()
	})
})
