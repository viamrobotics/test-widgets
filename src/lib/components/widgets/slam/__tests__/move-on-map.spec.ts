import type { ComponentProps } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../move-on-map.svelte'

describe('Slam move on map', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
	})

	const moveOnMap = vi.fn()
	const stopPlan = vi.fn()

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
		render(Subject, {
			moveOnMap,
			stopPlan,
			...props,
		})

	it('holds back execute without a destination', async () => {
		renderSubject({})

		const executeButton = screen.getByRole('button', { name: 'Execute' })
		await user.click(executeButton)

		expect(executeButton).toHaveAttribute('aria-disabled', 'true')
		expect(moveOnMap).not.toHaveBeenCalled()
	})

	it('holds back execute while only X is typed', async () => {
		renderSubject({})

		await user.type(screen.getByRole('spinbutton', { name: 'X' }), '1')
		await user.click(screen.getByRole('button', { name: 'Execute' }))

		expect(moveOnMap).not.toHaveBeenCalled()
	})

	it('moves to the typed X and Y with the typed plan deviation', async () => {
		renderSubject({})

		await user.type(screen.getByRole('spinbutton', { name: 'X' }), '100')
		await user.type(screen.getByRole('spinbutton', { name: 'Y' }), '200')
		await user.type(screen.getByRole('spinbutton', { name: 'Plan deviation' }), '4')
		await user.click(screen.getByRole('button', { name: 'Execute' }))

		expect(moveOnMap).toHaveBeenCalledExactlyOnceWith({ x: 100, y: 200 }, 4)
	})

	it('moves to a destination set from outside with no plan deviation', async () => {
		renderSubject({ x: 1.5, y: -2 })

		await user.click(screen.getByRole('button', { name: 'Execute' }))

		expect(moveOnMap).toHaveBeenCalledExactlyOnceWith({ x: 1.5, y: -2 }, undefined)
	})

	it('stops the plan', async () => {
		renderSubject({})

		await user.click(screen.getByRole('button', { name: 'Stop' }))

		expect(stopPlan).toHaveBeenCalledOnce()
	})
})
