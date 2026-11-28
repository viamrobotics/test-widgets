import type { ComponentProps } from 'svelte'

import { fireEvent, render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../QuickMove.svelte'

describe('Motor QuickMove', () => {
	let user: ReturnType<typeof userEvent.setup>
	let setPower: (power: number) => void
	let onRelease: () => void

	beforeEach(() => {
		user = userEvent.setup()
		setPower = vi.fn()
		onRelease = vi.fn()
	})

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
		render(Subject, {
			setPower,
			onRelease,
			...props,
		})

	it('calls setPower with positive value on forward button mousedown', async () => {
		renderSubject({})

		// This presses the forward button without releasing it.
		const forwardButton = screen.getByRole('button', { name: /forward/iu })
		await user.pointer({ target: forwardButton, keys: '[MouseLeft>]' })

		expect(setPower).toHaveBeenCalledWith(0.5)
		expect(onRelease).not.toHaveBeenCalled()
	})

	it('calls setPower with negative value on backward button mousedown', async () => {
		renderSubject({})

		const backwardButton = screen.getByRole('button', { name: /backward/iu })
		await user.pointer({ target: backwardButton, keys: '[MouseLeft>]' })

		expect(setPower).toHaveBeenCalledWith(-0.5)
	})

	it('calls onRelease on button mouseup', async () => {
		renderSubject({})

		const forwardButton = screen.getByRole('button', { name: /forward/iu })
		await user.click(forwardButton)

		expect(setPower).toHaveBeenCalledWith(0.5)
		expect(onRelease).toHaveBeenCalledTimes(1)
	})

	it('sends power once and releases once for one pointer press and release', async () => {
		renderSubject({})

		await user.pointer({
			target: screen.getByRole('button', { name: /forward/iu }),
			keys: '[MouseLeft>]',
		})
		await user.pointer({ keys: '[/MouseLeft]' })

		expect(vi.mocked(setPower).mock.calls).toEqual([[0.5]])
		expect(onRelease).toHaveBeenCalledTimes(1)
	})

	it('sends power when Space is held on the focused forward button and releases on key up', async () => {
		renderSubject({})

		screen.getByRole('button', { name: /forward/iu }).focus()
		await user.keyboard('[Space>]')

		expect(vi.mocked(setPower).mock.calls).toEqual([[0.5]])

		expect(onRelease).not.toHaveBeenCalled()

		await user.keyboard('[/Space]')

		expect(vi.mocked(setPower).mock.calls).toEqual([[0.5]])
		expect(onRelease).toHaveBeenCalledTimes(1)
	})

	it('sends negative power when Enter is held on the focused backward button', async () => {
		renderSubject({})

		screen.getByRole('button', { name: /backward/iu }).focus()
		await user.keyboard('{Enter>}')

		expect(vi.mocked(setPower).mock.calls).toEqual([[-0.5]])
	})

	it('does not resend power while a held key repeats', async () => {
		renderSubject({})

		screen.getByRole('button', { name: /forward/iu }).focus()
		await user.keyboard('{Enter>3/}')

		expect(vi.mocked(setPower).mock.calls).toEqual([[0.5]])
		expect(onRelease).toHaveBeenCalledTimes(1)
	})

	it('releases when the pointer is cancelled mid-hold', async () => {
		renderSubject({})

		const forwardButton = screen.getByRole('button', { name: /forward/iu })
		await user.pointer({ target: forwardButton, keys: '[MouseLeft>]' })
		await fireEvent(forwardButton, new PointerEvent('pointercancel', { bubbles: true }))

		expect(vi.mocked(setPower).mock.calls).toEqual([[0.5]])
		expect(onRelease).toHaveBeenCalledTimes(1)
	})

	it('releases when the button loses focus mid-hold', async () => {
		renderSubject({})

		const forwardButton = screen.getByRole('button', { name: /forward/iu })
		forwardButton.focus()
		await user.keyboard('[Space>]')
		forwardButton.blur()

		expect(vi.mocked(setPower).mock.calls).toEqual([[0.5]])
		expect(onRelease).toHaveBeenCalledTimes(1)
	})

	it('releases when the page becomes hidden mid-hold', async () => {
		renderSubject({})

		await user.pointer({
			target: screen.getByRole('button', { name: /forward/iu }),
			keys: '[MouseLeft>]',
		})
		vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
		document.dispatchEvent(new Event('visibilitychange'))

		expect(vi.mocked(setPower).mock.calls).toEqual([[0.5]])
		expect(onRelease).toHaveBeenCalledTimes(1)
	})

	it('describes both buttons with the press and hold hint', () => {
		renderSubject({})

		expect(screen.getByRole('button', { name: /forward/iu })).toHaveAccessibleDescription(
			'Press and hold'
		)
		expect(screen.getByRole('button', { name: /backward/iu })).toHaveAccessibleDescription(
			'Press and hold'
		)
	})

	describe('power range props', () => {
		const power = () => screen.getByRole('slider', { name: /power/iu })

		it('spans 0 to 1 with the props absent', () => {
			renderSubject({})

			expect(power()).toHaveAttribute('min', '0')
			expect(power()).toHaveAttribute('max', '1')
		})

		it('spans the given range and clamps the starting value into it', async () => {
			renderSubject({ minPowerPct: 0.6, maxPowerPct: 0.9 })

			expect(power()).toHaveAttribute('min', '0.6')
			expect(power()).toHaveAttribute('max', '0.9')

			await user.pointer({
				target: screen.getByRole('button', { name: /forward/iu }),
				keys: '[MouseLeft>]',
			})

			expect(setPower).toHaveBeenCalledWith(0.6)
		})

		it('clamps the starting value down to a maximum below it', async () => {
			renderSubject({ maxPowerPct: 0.3 })

			await user.pointer({
				target: screen.getByRole('button', { name: /backward/iu }),
				keys: '[MouseLeft>]',
			})

			expect(setPower).toHaveBeenCalledWith(-0.3)
		})

		it.each([
			['min not below max', { minPowerPct: 0.8, maxPowerPct: 0.4 }],
			['max above 1', { minPowerPct: 0.2, maxPowerPct: 1.5 }],
			['negative min', { minPowerPct: -0.1, maxPowerPct: 0.9 }],
			['not finite', { minPowerPct: Number.NaN, maxPowerPct: 0.9 }],
		])('ignores an invalid pair: %s', async (_name, props) => {
			renderSubject(props)

			expect(power()).toHaveAttribute('min', '0')
			expect(power()).toHaveAttribute('max', '1')

			await user.pointer({
				target: screen.getByRole('button', { name: /forward/iu }),
				keys: '[MouseLeft>]',
			})

			expect(setPower).toHaveBeenCalledWith(0.5)
		})
	})
})
