import '../../../../../app.css'

import type { ComponentProps } from 'svelte'

import { fireEvent, render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../QuickMove.svelte'

const ZERO = { x: 0, y: 0, z: 0 }

const nextMacrotask = () =>
	new Promise((resolve) => {
		setTimeout(resolve, 0)
	})

const WAIT_PAST_SECOND_ZERO_MS = 100

const pastSecondZero = () =>
	new Promise((resolve) => {
		setTimeout(resolve, WAIT_PAST_SECOND_ZERO_MS)
	})

const isZeroPower = (linear: { y: number }, angular: { z: number }) =>
	linear.y === 0 && angular.z === 0

describe('Base QuickMove', () => {
	let user: ReturnType<typeof userEvent.setup>
	let setPower: ComponentProps<typeof Subject>['setPower']
	let stop: () => void
	let sibling: (event: KeyboardEvent) => void

	beforeEach(() => {
		user = userEvent.setup()
		setPower = vi.fn(() => Promise.resolve())
		stop = vi.fn()
		sibling = vi.fn()
		window.addEventListener('keydown', sibling)
	})

	afterEach(() => {
		window.removeEventListener('keydown', sibling)
	})

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>> = {}) =>
		render(Subject, { setPower, stop, ...props })

	const toggle = () => screen.getByRole('button', { name: 'Keyboard control' })

	const engage = async () => {
		await user.click(toggle())
	}

	describe('drive buttons', () => {
		it('draws the WASD cross in source order Forward, Left, Backward, Right', () => {
			renderSubject()

			const names = screen
				.getAllByRole('button')
				.map((button) => button.getAttribute('aria-label'))
				.filter((name) => name !== null)
			expect(names).toEqual(['Forward (W)', 'Left (A)', 'Backward (S)', 'Right (D)'])
		})

		it('puts Forward alone on the top row, above Backward', () => {
			renderSubject()

			const forward = screen.getByRole('button', { name: 'Forward (W)' }).getBoundingClientRect()
			const left = screen.getByRole('button', { name: 'Left (A)' }).getBoundingClientRect()
			const backward = screen.getByRole('button', { name: 'Backward (S)' }).getBoundingClientRect()
			const right = screen.getByRole('button', { name: 'Right (D)' }).getBoundingClientRect()
			expect(left.top, 'Left shares a row with Backward').toBe(backward.top)
			expect(right.top, 'Right shares a row with Backward').toBe(backward.top)
			expect(forward.bottom, 'Forward sits above the second row').toBeLessThanOrEqual(backward.top)
			expect(forward.left, 'Forward is in the middle column').toBe(backward.left)
		})

		it.each([
			['Forward (W)', { x: 0, y: 0.5, z: 0 }, ZERO],
			['Backward (S)', { x: 0, y: -0.5, z: 0 }, ZERO],
			['Left (A)', ZERO, { x: 0, y: 0, z: 0.5 }],
			['Right (D)', ZERO, { x: 0, y: 0, z: -0.5 }],
		])('sends setPower on a %s press', async (name, linear, angular) => {
			renderSubject()

			await user.pointer({
				target: screen.getByRole('button', { name }),
				keys: '[MouseLeft>]',
			})

			expect(setPower).toHaveBeenLastCalledWith(linear, angular)
		})

		it('sends zero power on release', async () => {
			renderSubject()

			await user.click(screen.getByRole('button', { name: 'Forward (W)' }))

			expect(setPower).toHaveBeenLastCalledWith(ZERO, ZERO)
		})

		it('drives at the power the slider sets', async () => {
			renderSubject()
			await fireEvent.input(screen.getByRole('slider', { name: 'Power' }), {
				target: { value: '0.75' },
			})

			await user.pointer({
				target: screen.getByRole('button', { name: 'Forward (W)' }),
				keys: '[MouseLeft>]',
			})

			expect(setPower).toHaveBeenLastCalledWith({ x: 0, y: 0.75, z: 0 }, ZERO)
		})

		it('combines two held pointers, as W and A do', async () => {
			vi.spyOn(Element.prototype, 'setPointerCapture').mockImplementation(() => undefined)
			renderSubject()

			await user.pointer([
				{ keys: '[TouchA>]', target: screen.getByRole('button', { name: 'Forward (W)' }) },
				{ keys: '[TouchB>]', target: screen.getByRole('button', { name: 'Left (A)' }) },
			])

			expect(setPower).toHaveBeenLastCalledWith({ x: 0, y: 0.5, z: 0 }, { x: 0, y: 0, z: 0.5 })
		})

		it('reads as disabled and starts no hold while disconnected', async () => {
			renderSubject({ isConnected: false })
			const forward = screen.getByRole('button', { name: 'Forward (W)' })

			await user.click(forward)

			expect(forward).toHaveAttribute('aria-disabled', 'true')
			expect(setPower).not.toHaveBeenCalled()
		})

		it('reads as disabled and starts no hold while another control moves the base', async () => {
			renderSubject({ isDriveBlocked: true })
			const forward = screen.getByRole('button', { name: 'Forward (W)' })

			await user.click(forward)

			expect(forward).toHaveAttribute('aria-disabled', 'true')
			expect(setPower).not.toHaveBeenCalled()
		})

		it('sends one Stop when the release zero and its repeat both fail', async () => {
			setPower = vi.fn((linear, angular) =>
				isZeroPower(linear, angular) ? Promise.reject(new Error('base offline')) : Promise.resolve()
			)
			renderSubject()

			await user.click(screen.getByRole('button', { name: 'Forward (W)' }))
			await pastSecondZero()

			expect(
				vi.mocked(setPower).mock.calls.filter(([linear, angular]) => isZeroPower(linear, angular)),
				'the zero and its repeat were both sent'
			).toHaveLength(2)
			expect(stop).toHaveBeenCalledOnce()
		})

		it('sends no Stop when the release zero succeeds', async () => {
			renderSubject()

			await user.click(screen.getByRole('button', { name: 'Forward (W)' }))
			await pastSecondZero()

			expect(stop).not.toHaveBeenCalled()
		})
	})

	describe('while idle', () => {
		it('reads the Keyboard control toggle as not pressed', () => {
			renderSubject()

			expect(toggle()).toHaveAttribute('aria-pressed', 'false')
		})

		it('drives nothing from keys', async () => {
			renderSubject()

			await user.keyboard('{w}{a}{s}{d}{ArrowUp}{ArrowLeft}{ArrowDown}{ArrowRight}')

			expect(setPower).not.toHaveBeenCalled()
		})

		it('lets drive keys reach sibling window listeners', async () => {
			renderSubject()

			await user.keyboard('{a}')

			expect(sibling).toHaveBeenCalledOnce()
		})

		it('keeps an empty status region mounted, so a later status is announced', () => {
			renderSubject()

			expect(screen.getByRole('status')).toBeEmptyDOMElement()
		})
	})

	describe('engaging while a text field has focus', () => {
		it('leaves the keys uncaptured and says why', async () => {
			renderSubject()
			const textField = document.createElement('input')
			document.body.append(textField)
			textField.focus()

			await user.click(toggle())

			expect(toggle(), 'not captured').toHaveAttribute('aria-pressed', 'false')
			expect(screen.getByRole('status')).toHaveTextContent(
				'Keyboard not captured while a text field has focus.'
			)
			textField.remove()
		})
	})

	describe('while captured', () => {
		it('reads the toggle as pressed with the same label', async () => {
			renderSubject()

			await engage()

			expect(toggle()).toHaveAttribute('aria-pressed', 'true')
		})

		it('says the keys are captured and how to release them', async () => {
			renderSubject()

			await engage()

			expect(screen.getByRole('status')).toHaveTextContent(
				'Keyboard captured. W A S D and arrows drive. Esc to release.'
			)
		})

		it('combines held drive keys and drops each one on release', async () => {
			renderSubject()
			await engage()

			await user.keyboard('{w>}')
			expect(setPower, 'W held').toHaveBeenLastCalledWith({ x: 0, y: 0.5, z: 0 }, ZERO)

			await user.keyboard('{a>}')
			expect(setPower, 'W and A held').toHaveBeenLastCalledWith(
				{ x: 0, y: 0.5, z: 0 },
				{ x: 0, y: 0, z: 0.5 }
			)

			await user.keyboard('{s>}')
			expect(setPower, 'W, A, and S held').toHaveBeenLastCalledWith(ZERO, { x: 0, y: 0, z: 0.5 })

			await user.keyboard('{d>}')
			expect(setPower, 'all four held').toHaveBeenLastCalledWith(ZERO, ZERO)

			await user.keyboard('{/w}')
			expect(setPower, 'W released').toHaveBeenLastCalledWith({ x: 0, y: -0.5, z: 0 }, ZERO)

			await user.keyboard('{/a}')
			expect(setPower, 'A released').toHaveBeenLastCalledWith(
				{ x: 0, y: -0.5, z: 0 },
				{ x: 0, y: 0, z: -0.5 }
			)

			await user.keyboard('{/s}')
			expect(setPower, 'S released').toHaveBeenLastCalledWith(ZERO, { x: 0, y: 0, z: -0.5 })

			await user.keyboard('{/d}')
			expect(setPower, 'D released').toHaveBeenLastCalledWith(ZERO, ZERO)
		})

		it('drives forward from the up arrow', async () => {
			renderSubject()
			await engage()

			await user.keyboard('{ArrowUp>}')

			expect(setPower).toHaveBeenLastCalledWith({ x: 0, y: 0.5, z: 0 }, ZERO)
		})

		it.each([
			'{w}',
			'{a}',
			'{s}',
			'{d}',
			'{ArrowUp}',
			'{ArrowLeft}',
			'{ArrowDown}',
			'{ArrowRight}',
		])('keeps %s from sibling window listeners', async (key) => {
			renderSubject()
			await engage()

			await user.keyboard(key)

			expect(sibling).not.toHaveBeenCalled()
		})

		it('lets every other key reach sibling window listeners', async () => {
			renderSubject()
			await engage()

			await user.keyboard('{q}')

			expect(sibling).toHaveBeenCalledOnce()
		})

		it('leaves an arrow key to the Power slider when it has focus', async () => {
			renderSubject()
			await engage()

			await fireEvent.keyDown(screen.getByRole('slider', { name: 'Power' }), { key: 'ArrowRight' })

			expect(setPower, 'no drive').not.toHaveBeenCalled()
			expect(sibling, 'the key reaches the slider and the page').toHaveBeenCalledOnce()
		})

		it('drives from W while the Power slider has focus', async () => {
			renderSubject()
			await engage()

			await fireEvent.keyDown(screen.getByRole('slider', { name: 'Power' }), { key: 'w' })

			expect(setPower).toHaveBeenLastCalledWith({ x: 0, y: 0.5, z: 0 }, ZERO)
		})

		it('releases an arrow key that comes up after focus moved to the Power slider', async () => {
			renderSubject()
			await engage()
			await user.keyboard('{ArrowUp>}')

			await fireEvent.keyUp(screen.getByRole('slider', { name: 'Power' }), { key: 'ArrowUp' })

			expect(setPower).toHaveBeenLastCalledWith(ZERO, ZERO)
		})

		it.each(['ctrlKey', 'metaKey', 'altKey'])(
			'releases a held key that comes up with %s down',
			async (modifier) => {
				renderSubject()
				await engage()
				await user.keyboard('{w>}')

				await fireEvent.keyUp(window, { key: 'w', [modifier]: true })

				expect(setPower).toHaveBeenLastCalledWith(ZERO, ZERO)
			}
		)

		it('starts no hold from a key while another control moves the base, and keeps the key from the page', async () => {
			renderSubject({ isDriveBlocked: true })
			await engage()

			await user.keyboard('{w>}')

			expect(setPower, 'no drive').not.toHaveBeenCalled()
			expect(sibling, 'the key stays captured').not.toHaveBeenCalled()
		})

		it('skips a drive key whose target is a text field', async () => {
			renderSubject()
			const textField = document.createElement('input')
			document.body.append(textField)
			await engage()

			await fireEvent.keyDown(textField, { key: 'w' })

			expect(setPower, 'no drive from a text field').not.toHaveBeenCalled()
			expect(sibling, 'the key reaches the page').toHaveBeenCalledOnce()
			textField.remove()
		})
	})

	describe('releasing capture', () => {
		it('releases on Esc', async () => {
			renderSubject()
			await engage()

			await user.keyboard('{Escape}')

			expect(toggle()).toHaveAttribute('aria-pressed', 'false')
		})

		it('releases on a second press of the toggle', async () => {
			renderSubject()
			await engage()

			await user.click(toggle())

			expect(toggle()).toHaveAttribute('aria-pressed', 'false')
		})

		it('releases when the window loses focus', async () => {
			renderSubject()
			await engage()

			await fireEvent.blur(window)

			expect(toggle()).toHaveAttribute('aria-pressed', 'false')
		})

		it('releases when the tab goes hidden', async () => {
			renderSubject()
			await engage()

			vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
			await fireEvent(document, new Event('visibilitychange'))

			expect(toggle()).toHaveAttribute('aria-pressed', 'false')
		})

		it('releases on a click outside the control', async () => {
			renderSubject()
			const outside = document.createElement('button')
			outside.textContent = 'Outside'
			document.body.append(outside)
			await nextMacrotask()
			await engage()

			const { left, top } = outside.getBoundingClientRect()
			await user.pointer({
				target: outside,
				keys: '[MouseLeft]',
				coords: { clientX: left + 1, clientY: top + 1 },
			})

			await vi.waitFor(() => {
				expect(toggle()).toHaveAttribute('aria-pressed', 'false')
			})
			outside.remove()
		})

		it('releases when focus moves into a text field', async () => {
			renderSubject()
			const textField = document.createElement('input')
			document.body.append(textField)
			await engage()

			textField.focus()
			await fireEvent.focusIn(textField)

			expect(toggle()).toHaveAttribute('aria-pressed', 'false')
			textField.remove()
		})

		it('lets drive keys through to the page again once released', async () => {
			renderSubject()
			await engage()
			await user.keyboard('{Escape}')

			await user.keyboard('{a}')

			expect(sibling).toHaveBeenCalledTimes(2)
		})
	})

	describe('losing capture with a drive key held', () => {
		it('sends one Stop instead of a zero power', async () => {
			renderSubject()
			await engage()
			await user.keyboard('{w>}')
			vi.mocked(setPower).mockClear()

			await fireEvent.blur(window)

			expect(stop, 'Stop').toHaveBeenCalledOnce()
			expect(setPower, 'no zero power').not.toHaveBeenCalled()
		})

		it('says the Stop was sent', async () => {
			renderSubject()
			await engage()
			await user.keyboard('{w>}')

			await fireEvent.blur(window)

			expect(screen.getByRole('status')).toHaveTextContent(
				'Keyboard released while driving. Sent Stop.'
			)
		})

		it('sends Stop when the control unmounts mid-drive', async () => {
			const { unmount } = renderSubject()
			await engage()
			await user.keyboard('{w>}')

			unmount()

			expect(stop).toHaveBeenCalledOnce()
		})

		it('sends Stop when the connection drops mid-drive', async () => {
			const { rerender } = renderSubject({ isConnected: true })
			await engage()
			await user.keyboard('{w>}')

			await rerender({ isConnected: false })

			expect(stop, 'Stop').toHaveBeenCalledOnce()
			expect(toggle(), 'capture released').toHaveAttribute('aria-pressed', 'false')
		})

		it('sends zero power when no stop is wired', async () => {
			renderSubject({ stop: undefined })
			await engage()
			await user.keyboard('{w>}')

			await fireEvent.blur(window)

			expect(setPower).toHaveBeenLastCalledWith(ZERO, ZERO)
		})

		it('keeps driving from a pad a pointer still holds, and sends no Stop', async () => {
			renderSubject()
			await engage()
			await user.keyboard('{a>}')
			await user.pointer({
				target: screen.getByRole('button', { name: 'Forward (W)' }),
				keys: '[MouseLeft>]',
			})

			await user.keyboard('{Escape}')

			expect(stop, 'no Stop').not.toHaveBeenCalled()
			expect(setPower, 'forward alone').toHaveBeenLastCalledWith({ x: 0, y: 0.5, z: 0 }, ZERO)
		})

		it('sends no Stop when no drive key is held', async () => {
			renderSubject()
			await engage()

			await fireEvent.blur(window)

			expect(stop).not.toHaveBeenCalled()
		})
	})

	describe('with two quick moves on the page', () => {
		it('lets only one hold the keys', async () => {
			render(Subject, { setPower, stop })
			render(Subject, { setPower, stop })
			const [first, second] = screen.getAllByRole('button', { name: 'Keyboard control' })
			if (!first || !second) throw new Error('Expected two Keyboard control toggles')
			await user.click(first)

			await user.click(second)

			expect(first, 'the first released').toHaveAttribute('aria-pressed', 'false')
			expect(second, 'the second captured').toHaveAttribute('aria-pressed', 'true')
		})

		it('sends Stop from the one that loses the keys mid-drive', async () => {
			const firstStop = vi.fn()
			render(Subject, { setPower, stop: firstStop })
			render(Subject, { setPower, stop })
			const [first, second] = screen.getAllByRole('button', { name: 'Keyboard control' })
			if (!first || !second) throw new Error('Expected two Keyboard control toggles')
			await user.click(first)
			await user.keyboard('{w>}')

			await fireEvent.click(second)

			expect(firstStop).toHaveBeenCalledOnce()
		})
	})
})
