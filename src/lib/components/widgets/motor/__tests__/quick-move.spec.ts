import type { ComponentProps } from 'svelte'

import { fireEvent, render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../quick-move.svelte'

describe('Motor QuickMove', () => {
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

	it('calls setPower with positive value on forward button mousedown', async () => {
		renderSubject({})

		// This presses the forward button without releasing it.
		const forwardButton = screen.getByRole('button', { name: /forward/iu })
		await user.pointer({ target: forwardButton, keys: '[MouseLeft>]' })

		expect(setPower).toHaveBeenCalledWith(0.5)
		expect(setPower).not.toHaveBeenCalledWith(0)
	})

	it('calls setPower with negative value on backward button mousedown', async () => {
		renderSubject({})

		const backwardButton = screen.getByRole('button', { name: /backward/iu })
		await user.pointer({ target: backwardButton, keys: '[MouseLeft>]' })

		expect(setPower).toHaveBeenCalledWith(-0.5)
	})

	it('calls setPower with zero on button mouseup', async () => {
		renderSubject({})

		const forwardButton = screen.getByRole('button', { name: /forward/iu })
		await user.click(forwardButton)

		expect(setPower).toHaveBeenCalledWith(0.5)
		expect(setPower).toHaveBeenCalledWith(0)
	})

	it('sends power once and 0 once for one pointer press and release', async () => {
		renderSubject({})

		await user.pointer({
			target: screen.getByRole('button', { name: /forward/iu }),
			keys: '[MouseLeft>]',
		})
		await user.pointer({ keys: '[/MouseLeft]' })

		expect(vi.mocked(setPower).mock.calls).toEqual([[0.5], [0]])
	})

	it('sends power when Space is held on the focused forward button and 0 when released', async () => {
		renderSubject({})

		screen.getByRole('button', { name: /forward/iu }).focus()
		await user.keyboard('[Space>]')

		expect(vi.mocked(setPower).mock.calls).toEqual([[0.5]])

		await user.keyboard('[/Space]')

		expect(vi.mocked(setPower).mock.calls).toEqual([[0.5], [0]])
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

		expect(vi.mocked(setPower).mock.calls).toEqual([[0.5], [0]])
	})

	it('sends 0 when the pointer is cancelled mid-hold', async () => {
		renderSubject({})

		const forwardButton = screen.getByRole('button', { name: /forward/iu })
		await user.pointer({ target: forwardButton, keys: '[MouseLeft>]' })
		await fireEvent(forwardButton, new PointerEvent('pointercancel', { bubbles: true }))

		expect(vi.mocked(setPower).mock.calls).toEqual([[0.5], [0]])
	})

	it('sends 0 when the button loses focus mid-hold', async () => {
		renderSubject({})

		const forwardButton = screen.getByRole('button', { name: /forward/iu })
		forwardButton.focus()
		await user.keyboard('[Space>]')
		forwardButton.blur()

		expect(vi.mocked(setPower).mock.calls).toEqual([[0.5], [0]])
	})

	it('sends 0 when the page becomes hidden mid-hold', async () => {
		renderSubject({})

		await user.pointer({
			target: screen.getByRole('button', { name: /forward/iu }),
			keys: '[MouseLeft>]',
		})
		vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
		document.dispatchEvent(new Event('visibilitychange'))

		expect(vi.mocked(setPower).mock.calls).toEqual([[0.5], [0]])
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
})
