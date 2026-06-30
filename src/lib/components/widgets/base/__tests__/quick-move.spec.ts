import type { ComponentProps } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../quick-move.svelte'

describe('Base QuickMove', () => {
	let user: ReturnType<typeof userEvent.setup>
	let setPower: (
		linear: { x: number; y: number; z: number },
		angular: { x: number; y: number; z: number }
	) => void

	beforeEach(() => {
		user = userEvent.setup()
		setPower = vi.fn()
	})

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
		render(Subject, {
			setPower,
			isKeyboardEnabled: false,
			...props,
		})

	it('calls setPower with positive linear y on forwards button mousedown', async () => {
		renderSubject({})

		const forwardsButton = screen.getByRole('button', { name: /forwards/iu })
		await user.pointer({ target: forwardsButton, keys: '[MouseLeft>]' })

		expect(setPower).toHaveBeenCalledWith({ x: 0, y: 0.5, z: 0 }, { x: 0, y: 0, z: 0 })
	})

	it('calls setPower with negative linear y on backwards button mousedown', async () => {
		renderSubject({})

		const backwardsButton = screen.getByRole('button', { name: /backwards/iu })
		await user.pointer({ target: backwardsButton, keys: '[MouseLeft>]' })

		expect(setPower).toHaveBeenCalledWith({ x: 0, y: -0.5, z: 0 }, { x: 0, y: 0, z: 0 })
	})

	it('calls setPower with positive angular z on left button mousedown', async () => {
		renderSubject({})

		const leftButton = screen.getByRole('button', { name: /left/iu })
		await user.pointer({ target: leftButton, keys: '[MouseLeft>]' })

		expect(setPower).toHaveBeenCalledWith({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0.5 })
	})

	it('calls setPower with negative angular z on right button mousedown', async () => {
		renderSubject({})

		const rightButton = screen.getByRole('button', { name: /right/iu })
		await user.pointer({ target: rightButton, keys: '[MouseLeft>]' })

		expect(setPower).toHaveBeenCalledWith({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -0.5 })
	})

	it('calls setPower with zero on button mouseup', async () => {
		renderSubject({})

		const forwardsButton = screen.getByRole('button', { name: /forwards/iu })
		await user.click(forwardsButton)

		expect(setPower).toHaveBeenCalledWith({ x: 0, y: 0.5, z: 0 }, { x: 0, y: 0, z: 0 })
		expect(setPower).toHaveBeenCalledWith({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 })
	})

	it('updates powerPct when the range input is changed', async () => {
		renderSubject({})

		const rangeInput = screen.getByRole('spinbutton')
		await user.clear(rangeInput)
		await user.type(rangeInput, '0.75')

		const forwardsButton = screen.getByRole('button', { name: /forwards/iu })
		await user.pointer({ target: forwardsButton, keys: '[MouseLeft>]' })

		expect(setPower).toHaveBeenCalledWith({ x: 0, y: 0.75, z: 0 }, { x: 0, y: 0, z: 0 })
	})

	it('stops movement keys from reaching sibling window listeners when enabled', async () => {
		const sibling = vi.fn()
		window.addEventListener('keydown', sibling)
		try {
			renderSubject({ isKeyboardEnabled: true })
			await user.keyboard('{a}')
			expect(sibling).not.toHaveBeenCalled()
		} finally {
			window.removeEventListener('keydown', sibling)
		}
	})

	it('lets keys reach sibling window listeners when disabled', async () => {
		const sibling = vi.fn()
		window.addEventListener('keydown', sibling)
		try {
			renderSubject({ isKeyboardEnabled: false })
			await user.keyboard('{a}')
			expect(sibling).toHaveBeenCalled()
		} finally {
			window.removeEventListener('keydown', sibling)
		}
	})

	it('does not set power when keyboard is disabled', async () => {
		renderSubject({ isKeyboardEnabled: false })

		await user.keyboard('{w}{a}{s}{d}{ArrowUp}{ArrowLeft}{ArrowDown}{ArrowRight}')

		expect(setPower).not.toHaveBeenCalled()
	})

	it('sets power when keyboard is enabled', async () => {
		renderSubject({ isKeyboardEnabled: true })

		// Cycle through pressing WASD without releasing,
		// then release in the same order. Does not test
		// arrow keys.
		await user.keyboard('{w>}')

		expect(setPower).toHaveBeenLastCalledWith({ x: 0, y: 0.5, z: 0 }, { x: 0, y: 0, z: 0 })

		await user.keyboard('{a>}')

		expect(setPower).toHaveBeenLastCalledWith({ x: 0, y: 0.5, z: 0 }, { x: 0, y: 0, z: 0.5 })

		await user.keyboard('{s>}')

		expect(setPower).toHaveBeenLastCalledWith({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0.5 })

		await user.keyboard('{d>}')

		expect(setPower).toHaveBeenLastCalledWith({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 })

		// Now release one-by-one
		await user.keyboard('{/w}')

		expect(setPower).toHaveBeenLastCalledWith({ x: 0, y: -0.5, z: 0 }, { x: 0, y: 0, z: 0 })

		await user.keyboard('{/a}')

		expect(setPower).toHaveBeenLastCalledWith({ x: 0, y: -0.5, z: 0 }, { x: 0, y: 0, z: -0.5 })

		await user.keyboard('{/s}')

		expect(setPower).toHaveBeenLastCalledWith({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: -0.5 })

		await user.keyboard('{/d}')

		expect(setPower).toHaveBeenLastCalledWith({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 })
	})
})
