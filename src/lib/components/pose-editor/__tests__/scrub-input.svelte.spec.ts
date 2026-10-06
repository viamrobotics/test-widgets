import { fireEvent, render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Host from './__fixtures__/scrub-input-host.svelte'

describe('ScrubInput', () => {
	const input = () => screen.getByRole('spinbutton')
	const handle = () => screen.getByRole('button', { hidden: true })

	const drag = async (dx: number, modifiers: PointerEventInit = {}) => {
		await fireEvent.pointerDown(handle(), { pointerId: 1, clientX: 100 })
		await fireEvent.pointerMove(handle(), { pointerId: 1, clientX: 100 + dx, ...modifiers })
		await fireEvent.pointerUp(handle(), { pointerId: 1, clientX: 100 + dx })
	}

	beforeEach(() => {
		vi.spyOn(HTMLElement.prototype, 'setPointerCapture').mockImplementation(() => undefined)
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('reads 0.1 after a 100 px drag at step 0.001', async () => {
		render(Host, { step: 0.001, value: 0 })
		await drag(100)
		expect(input()).toHaveValue(0.1)
	})

	it('reads 10 after a 100 px drag at step 0.1', async () => {
		render(Host, { step: 0.1, value: 0 })
		await drag(100)
		expect(input()).toHaveValue(10)
	})

	it('scales the drag by 10 with Shift held', async () => {
		render(Host, { step: 0.1, value: 0 })
		await drag(10, { shiftKey: true })
		expect(input()).toHaveValue(10)
	})

	it('scales the drag by 0.1 with Alt held', async () => {
		render(Host, { step: 0.1, value: 0 })
		await drag(7, { altKey: true })
		expect(input()).toHaveValue(0.07)
	})

	it('keeps the spinbutton role and forwards aria-describedby', () => {
		render(Host, { step: 0.1, value: 0, 'aria-describedby': 'hint' })
		expect(input()).toHaveAttribute('aria-describedby', 'hint')
	})

	it('commits a typed value on change', async () => {
		render(Host, { step: 0.1, value: 1 })
		await userEvent.clear(input())
		await userEvent.type(input(), '5')
		await userEvent.tab()
		expect(screen.getByTestId('bound')).toHaveTextContent('5')
	})
})
