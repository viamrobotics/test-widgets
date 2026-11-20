import { fireEvent, render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { createResourceClient } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../read-write-pins-widget.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const boardCalls = vi.hoisted(() => ({ mutate: vi.fn() }))

vi.mock('@viamrobotics/sdk', () => ({
	BoardClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn((_client: unknown, method: string) => ({
		mutateAsync: (args: unknown[]) => boardCalls.mutate(method, args),
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-board' },
	})

const STATE_SET = 0
const DUTY_CYCLE_SET = 1
const FREQUENCY_SET = 2

const setButton = (position: number) => {
	const button = screen.getAllByRole('button', { name: 'Set' }).at(position)
	if (!button) throw new Error(`No Set button at ${position}`)
	return button
}

const getIn = (rowName: string) =>
	within(screen.getByRole('group', { name: rowName })).getByRole('button', { name: 'Get' })

describe('Board ReadWritePins widget', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
	})

	const enterPin = async (pin: string) => {
		await user.type(screen.getByRole('textbox', { name: 'Pin' }), pin)
		await user.tab()
	}

	const pick = async (choice: 'GPIO' | 'Analog' | 'Read' | 'Write') => {
		await user.click(screen.getByRole('radio', { name: choice }))
	}

	it('heads the surface with a Pins row', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Pins' })).toBeInTheDocument()
	})

	it('offers a Pin field with an example placeholder', () => {
		renderSubject()

		expect(screen.getByRole('textbox', { name: 'Pin' })).toHaveAttribute('placeholder', '11')
	})

	it('starts on GPIO and Write', () => {
		renderSubject()

		const pinType = within(screen.getByRole('group', { name: 'Pin type' }))
		const mode = within(screen.getByRole('group', { name: 'Mode' }))
		expect(pinType.getByRole('radio', { name: 'GPIO' })).toHaveAttribute('aria-checked', 'true')
		expect(mode.getByRole('radio', { name: 'Write' })).toHaveAttribute('aria-checked', 'true')
	})

	it('shows the GPIO write body by default', () => {
		renderSubject()

		expect(screen.getByRole('spinbutton', { name: 'Duty cycle' })).toBeInTheDocument()
	})

	it('creates the board client for the given part', () => {
		renderSubject()

		const getPartID = vi.mocked(createResourceClient).mock.lastCall?.[1]
		expect(getPartID?.()).toBe('test-part')
	})

	it('creates the board client for the given resource name', () => {
		renderSubject()

		const getResourceName = vi.mocked(createResourceClient).mock.lastCall?.[2]
		expect(getResourceName?.()).toBe('test-board')
	})

	it('sends setGPIO high for the entered pin', async () => {
		renderSubject()
		await enterPin('7')

		await user.click(setButton(STATE_SET))

		expect(boardCalls.mutate).toHaveBeenCalledWith('setGPIO', ['7', true])
	})

	it('sends setPWM with the typed percent divided by 100 for the entered pin', async () => {
		renderSubject()
		await enterPin('7')
		const dutyCycle = screen.getByRole('spinbutton', { name: 'Duty cycle' })
		await user.clear(dutyCycle)
		await user.type(dutyCycle, '25')

		await user.click(setButton(DUTY_CYCLE_SET))

		expect(boardCalls.mutate).toHaveBeenCalledWith('setPWM', ['7', 0.25])
	})

	it('sends setPWMFrequency with the typed hertz for the entered pin', async () => {
		renderSubject()
		await enterPin('7')
		const frequency = screen.getByRole('spinbutton', { name: 'Frequency' })
		await user.clear(frequency)
		await user.type(frequency, '500')

		await user.click(setButton(FREQUENCY_SET))

		expect(boardCalls.mutate).toHaveBeenCalledWith('setPWMFrequency', ['7', 500])
	})

	it('sends getGPIO for the entered pin in read mode', async () => {
		renderSubject()
		await pick('Read')
		await enterPin('7')

		await user.click(getIn('State'))

		expect(boardCalls.mutate).toHaveBeenCalledWith('getGPIO', ['7'])
	})

	it('sends getPWM for the entered pin in read mode', async () => {
		renderSubject()
		await pick('Read')
		await enterPin('7')

		await user.click(getIn('Duty cycle'))

		expect(boardCalls.mutate).toHaveBeenCalledWith('getPWM', ['7'])
	})

	it('sends getPWMFrequency for the entered pin in read mode', async () => {
		renderSubject()
		await pick('Read')
		await enterPin('7')

		await user.click(getIn('Frequency'))

		expect(boardCalls.mutate).toHaveBeenCalledWith('getPWMFrequency', ['7'])
	})

	it('reads the high level getGPIO returns', async () => {
		boardCalls.mutate.mockResolvedValue(true)
		renderSubject()
		await pick('Read')

		await user.click(getIn('State'))

		const state = within(screen.getByRole('group', { name: 'State' })).getByRole('status')
		await vi.waitFor(() => {
			expect(state).toHaveTextContent('High')
		})
	})

	it('sends readAnalogReader for the entered pin in analog read mode', async () => {
		renderSubject()
		await pick('Analog')
		await pick('Read')
		await enterPin('A1')

		await user.click(getIn('Value'))

		expect(boardCalls.mutate).toHaveBeenCalledWith('readAnalogReader', ['A1'])
	})

	it('sends writeAnalog with the entered pin and value in analog write mode', async () => {
		renderSubject()
		await pick('Analog')
		await enterPin('A1')
		const value = screen.getByRole('spinbutton', { name: 'Value' })
		await user.clear(value)
		await user.type(value, '25')

		await user.click(screen.getByRole('button', { name: 'Set' }))

		expect(boardCalls.mutate).toHaveBeenCalledWith('writeAnalog', ['A1', 25])
	})

	it('holds the pin across a mode change', async () => {
		renderSubject()
		await enterPin('7')

		await pick('Read')

		expect(screen.getByRole('textbox', { name: 'Pin' })).toHaveValue('7')
	})

	it('confirms a successful call on its button', async () => {
		renderSubject()

		await user.click(setButton(STATE_SET))

		expect(await screen.findByRole('button', { name: 'Set, done' })).toBeInTheDocument()
	})

	it('shows the error a failed board call rejects with in the Pins indicator', async () => {
		boardCalls.mutate.mockRejectedValue(new Error('board unreachable'))
		renderSubject()
		await enterPin('7')

		await user.click(setButton(STATE_SET))
		const indicator = await screen.findByRole('button', { name: '1 error, copy to clipboard' })
		await fireEvent.focusIn(indicator)

		expect(screen.getByText('Error: board unreachable')).toBeInTheDocument()
	})

	it('shows no check after a failed call', async () => {
		boardCalls.mutate.mockRejectedValue(new Error('board unreachable'))
		renderSubject()

		await user.click(setButton(STATE_SET))

		await screen.findByRole('button', { name: '1 error, copy to clipboard' })
		expect(screen.queryByRole('button', { name: 'Set, done' })).toBeNull()
	})

	it('clears the indicator once a later call succeeds', async () => {
		boardCalls.mutate.mockRejectedValueOnce(new Error('board unreachable'))
		renderSubject()
		await user.click(setButton(STATE_SET))
		await screen.findByRole('button', { name: '1 error, copy to clipboard' })

		await user.click(setButton(STATE_SET))

		expect(await screen.findByRole('button', { name: 'No errors' })).toBeInTheDocument()
	})
})

const PANE_WIDTH = '320px'
const WIDE_PANE_PX = 560

const renderInPane = () => {
	render(PaneSubject, { props: { widget: Subject } })
	const pane = screen.getByTestId('pane')
	const root = pane.firstElementChild
	if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')
	return { pane, root }
}

const bodyStartsBesideSelector = () => {
	const mode = screen.getByRole('group', { name: 'Mode' }).getBoundingClientRect()
	const state = screen.getByRole('group', { name: 'State' }).getBoundingClientRect()
	return state.top < mode.bottom
}

describe('Board ReadWritePins widget in a 320 px pane', () => {
	it('loads the app stylesheet, so the pane takes its utility width', () => {
		const { pane } = renderInPane()

		expect(getComputedStyle(pane).width).toBe(PANE_WIDTH)
	})

	it('does not scroll horizontally', () => {
		const { pane, root } = renderInPane()

		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})

	it('stacks the body under the selector', () => {
		renderInPane()

		expect(bodyStartsBesideSelector(), 'the State row starts above the Mode row ends').toBe(false)
	})
})

describe('Board ReadWritePins widget in a wide pane', () => {
	it('sets the body beside the selector', () => {
		const { pane } = renderInPane()

		pane.style.width = `${WIDE_PANE_PX}px`

		expect(bodyStartsBesideSelector(), 'the State row starts above the Mode row ends').toBe(true)
	})
})
