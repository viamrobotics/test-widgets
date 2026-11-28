import type { ComponentProps } from 'svelte'

import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../MoveOnMap.svelte'

const endPositionField = (axis: 'X' | 'Y') =>
	within(screen.getByRole('group', { name: 'End position' })).getByRole('spinbutton', {
		name: axis,
	})

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
			isMoving: false,
			statusText: '',
			...props,
		})

	it('holds back execute without a destination', async () => {
		renderSubject({})

		const executeButton = screen.getByRole('button', { name: 'Execute' })
		await user.click(executeButton)

		expect(executeButton).toHaveAttribute('aria-disabled', 'true')
		expect(executeButton).toHaveAccessibleDescription('Enter an end position X and Y first.')
		expect(moveOnMap).not.toHaveBeenCalled()
	})

	it('holds back execute again once X is cleared', async () => {
		renderSubject({ x: 1, y: 2 })

		await user.clear(endPositionField('X'))
		await user.click(screen.getByRole('button', { name: 'Execute' }))

		expect(moveOnMap).not.toHaveBeenCalled()
	})

	it('shows the status text it is given', () => {
		renderSubject({ statusText: 'Move on map failed' })

		expect(screen.getByTestId('status-line').textContent.trim()).toBe('Move on map failed')
	})

	it('holds back execute while only X is typed', async () => {
		renderSubject({})

		await user.type(endPositionField('X'), '1')
		await user.click(screen.getByRole('button', { name: 'Execute' }))

		expect(moveOnMap).not.toHaveBeenCalled()
	})

	it('moves to the typed X and Y with the typed plan deviation', async () => {
		renderSubject({})

		await user.type(endPositionField('X'), '100')
		await user.type(endPositionField('Y'), '200')
		await user.type(screen.getByRole('spinbutton', { name: 'Plan deviation' }), '4')
		await user.click(screen.getByRole('button', { name: 'Execute' }))

		expect(moveOnMap).toHaveBeenCalledExactlyOnceWith({ x: 100, y: 200 }, 4)
	})

	it('moves to a destination set from outside with no plan deviation', async () => {
		renderSubject({ x: 1.5, y: -2 })

		await user.click(screen.getByRole('button', { name: 'Execute' }))

		expect(moveOnMap).toHaveBeenCalledExactlyOnceWith({ x: 1.5, y: -2 }, undefined)
	})

	it('shows Execute as in progress and drops a press while a move is in flight', async () => {
		renderSubject({ x: 1, y: 2, isMoving: true })

		const executeButton = screen.getByRole('button', { name: 'Execute' })
		await user.click(executeButton)

		expect(executeButton).toHaveAttribute('aria-disabled', 'true')
		expect(executeButton).not.toHaveAttribute('aria-busy')
		expect(executeButton).toHaveAccessibleDescription('Wait for the move in flight to finish.')
		expect(moveOnMap).not.toHaveBeenCalled()
	})

	it('keeps Stop live while a move is in flight', async () => {
		renderSubject({ x: 1, y: 2, isMoving: true })

		await user.click(screen.getByRole('button', { name: 'Stop' }))

		expect(stopPlan).toHaveBeenCalledOnce()
	})

	it('keeps the visible labels X and Y on the end position fields', () => {
		renderSubject({})

		expect(screen.getByText('X', { selector: 'label' })).toBeInTheDocument()
		expect(screen.getByText('Y', { selector: 'label' })).toBeInTheDocument()
	})

	it('stops the plan', async () => {
		renderSubject({})

		await user.click(screen.getByRole('button', { name: 'Stop' }))

		expect(stopPlan).toHaveBeenCalledOnce()
	})
})
