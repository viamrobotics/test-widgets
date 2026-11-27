import '../../../../../app.css'

import { fireEvent, render, screen } from '@testing-library/svelte'
import { MachineConnectionEvent } from '@viamrobotics/sdk'
import { tick } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest'

import type { StandardGamepadEvent } from '../standard-gamepad-event'

import Subject from '../Webgamepad.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'
import { sceneHandlers } from './__fixtures__/scene-handlers'

const { mutateAsync } = vi.hoisted(() => ({
	mutateAsync: vi.fn(),
}))

vi.mock('../WebgamepadScene.svelte', async () => {
	const sceneMock = await import('./__fixtures__/WebgamepadSceneMock.svelte')
	return { default: sceneMock.default }
})

// The machine connection, reactive so a spec can drop it and bring it back.
const machineConnection = $state({ current: MachineConnectionEvent.CONNECTED })

vi.mock('@viamrobotics/svelte-sdk', () => {
	return {
		useConnectionStatus: vi.fn(() => machineConnection),
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceMutation: vi.fn(() => ({ mutateAsync, error: null })),
	}
})

const BUTTON_PRESS: StandardGamepadEvent = {
	type: 'down',
	target: 'clusterBottom',
	value: 1,
}

const STICK_HELD: StandardGamepadEvent = {
	type: 'change',
	target: 'leftStick',
	value: { x: 0.6, y: 0 },
}

const sentEvents = () =>
	mutateAsync.mock.calls.map(([events]) => {
		const [event] = events
		return { event: event.event, control: event.control, value: event.value }
	})

const engageAndPlay = async (...events: StandardGamepadEvent[]) => {
	const rendered = renderSubject()
	await setGamepadConnected(true)
	await fireEvent.click(getToggle())
	for (const event of events) {
		sceneHandlers.onChange(event)
	}
	await Promise.resolve()
	mutateAsync.mockClear()
	return rendered
}

const renderSubject = (resourceName = 'webgamepad') =>
	render(Subject, { props: { partID: 'test-part', resourceName } })

const setGamepadConnected = async (connected: boolean) => {
	sceneHandlers.onConnectionChange(connected)
	await Promise.resolve()
}

const getToggle = () => screen.getByRole('button', { name: 'Forward gamepad' })

describe('InputController.WebGamepad', () => {
	beforeEach(() => {
		mutateAsync.mockReset()
		mutateAsync.mockResolvedValue({})
	})

	it('heads the section Web gamepad with a Disconnected badge', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Web gamepad' })).toBeInTheDocument()
		expect(screen.getByText('Disconnected')).toBeInTheDocument()
	})

	it('explains why the toggle is held back with no gamepad', () => {
		renderSubject()

		expect(getToggle()).toHaveAccessibleDescription(
			'No gamepad connected. Press a button on a gamepad to connect it.'
		)
	})

	it('has no toggle and says why for a resource not named webgamepad', () => {
		renderSubject('other')

		expect(screen.queryByRole('button', { name: 'Forward gamepad' })).not.toBeInTheDocument()
		expect(screen.queryByText('Disconnected')).not.toBeInTheDocument()
		expect(
			screen.getByText('Gamepad forwarding needs an input controller named webgamepad.')
		).toBeInTheDocument()
	})

	it('holds back the toggle with no gamepad and keeps it focusable', async () => {
		renderSubject()

		expect(getToggle()).toHaveAttribute('aria-disabled', 'true')
		expect(getToggle()).not.toHaveAttribute('disabled')
		expect(screen.getByText('Disconnected')).toBeInTheDocument()

		await fireEvent.click(getToggle())
		expect(getToggle()).toHaveAttribute('aria-pressed', 'false')
	})

	it('sets aria-pressed when engaged and clears it on a second press', async () => {
		renderSubject()
		await setGamepadConnected(true)

		expect(screen.getByText('Connected')).toBeInTheDocument()
		expect(getToggle()).toHaveAttribute('aria-pressed', 'false')

		await fireEvent.click(getToggle())
		expect(getToggle()).toHaveAttribute('aria-pressed', 'true')

		await fireEvent.click(getToggle())
		expect(getToggle()).toHaveAttribute('aria-pressed', 'false')
	})

	it('sends no TriggerEvent before engaging', async () => {
		renderSubject()
		await setGamepadConnected(true)

		sceneHandlers.onChange(BUTTON_PRESS)
		await Promise.resolve()

		expect(mutateAsync).not.toHaveBeenCalled()
	})

	it('sends a TriggerEvent per change while engaged', async () => {
		renderSubject()
		await setGamepadConnected(true)
		await fireEvent.click(getToggle())

		sceneHandlers.onChange(BUTTON_PRESS)
		await Promise.resolve()

		expect(mutateAsync).toHaveBeenCalledTimes(1)
	})

	it('releases forwarding on window blur and sends nothing', async () => {
		renderSubject()
		await setGamepadConnected(true)
		await fireEvent.click(getToggle())

		await fireEvent.blur(window)

		expect(
			getToggle().getAttribute('aria-pressed'),
			'goes red when the window blur listener is removed'
		).toBe('false')
		expect(mutateAsync).not.toHaveBeenCalled()

		sceneHandlers.onChange(BUTTON_PRESS)
		await Promise.resolve()
		expect(mutateAsync).not.toHaveBeenCalled()
	})

	it('announces a gamepad that connects, and an unplug that stops forwarding', async () => {
		renderSubject()
		expect(screen.getByRole('status')).toHaveTextContent('')

		await setGamepadConnected(true)
		expect(screen.getByRole('status')).toHaveTextContent('Gamepad connected.')

		await fireEvent.click(getToggle())
		expect(screen.getByRole('status')).toHaveTextContent('')

		await setGamepadConnected(false)
		expect(screen.getByRole('status')).toHaveTextContent(
			'Gamepad disconnected. Forwarding stopped.'
		)
	})

	it('announces that forwarding stopped when the window blurs', async () => {
		renderSubject()
		await setGamepadConnected(true)
		await fireEvent.click(getToggle())

		await fireEvent.blur(window)

		expect(screen.getByRole('status')).toHaveTextContent('Forwarding stopped.')
	})

	it('releases forwarding on unplug', async () => {
		renderSubject()
		await setGamepadConnected(true)
		await fireEvent.click(getToggle())

		await setGamepadConnected(false)

		expect(getToggle()).toHaveAttribute('aria-pressed', 'false')
		expect(getToggle()).toHaveAttribute('aria-disabled', 'true')
	})
})

describe('InputController.WebGamepad release', () => {
	let visibilitySpy: MockInstance | undefined

	const hideTab = async () => {
		visibilitySpy = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
		await fireEvent(document, new Event('visibilitychange'))
	}

	beforeEach(() => {
		mutateAsync.mockReset()
		mutateAsync.mockResolvedValue({})
		machineConnection.current = MachineConnectionEvent.CONNECTED
	})

	afterEach(() => {
		visibilitySpy?.mockRestore()
		visibilitySpy = undefined
	})

	it('sends the neutral event for a held stick when the tab is hidden with no blur', async () => {
		await engageAndPlay(STICK_HELD)

		await hideTab()

		expect(sentEvents()).toEqual([{ event: 'PositionChangeAbs', control: 'AbsoluteX', value: 0 }])
		expect(getToggle()).toHaveAttribute('aria-pressed', 'false')
	})

	it('stops forwarding when the machine connection drops, and stays off after it returns', async () => {
		await engageAndPlay(STICK_HELD)

		machineConnection.current = MachineConnectionEvent.RECONNECTING
		await tick()
		expect(screen.queryByRole('button', { name: 'Forward gamepad' })).not.toBeInTheDocument()

		machineConnection.current = MachineConnectionEvent.CONNECTED
		await tick()
		await setGamepadConnected(true)
		mutateAsync.mockClear()

		expect(getToggle()).toHaveAttribute('aria-pressed', 'false')
		sceneHandlers.onChange(STICK_HELD)
		await Promise.resolve()
		expect(mutateAsync).not.toHaveBeenCalled()
	})

	it('sends PositionChangeAbs 0 for a held stick when the window blurs', async () => {
		await engageAndPlay(STICK_HELD)

		await fireEvent.blur(window)

		expect(
			sentEvents(),
			'falsified: with release sending nothing this was [] and the test went red'
		).toEqual([{ event: 'PositionChangeAbs', control: 'AbsoluteX', value: 0 }])
	})

	it('sends ButtonRelease 0 for a held button on a second press of the toggle', async () => {
		await engageAndPlay(BUTTON_PRESS)

		await fireEvent.click(getToggle())

		expect(sentEvents()).toEqual([{ event: 'ButtonRelease', control: 'ButtonSouth', value: 0 }])
	})

	it('sends nothing on release when every control is at rest', async () => {
		await engageAndPlay(STICK_HELD, { ...STICK_HELD, value: { x: 0, y: 0 } })

		await fireEvent.blur(window)

		expect(sentEvents()).toEqual([])
	})

	it('sends the neutral event when unmounted with a stick held', async () => {
		const { unmount } = await engageAndPlay(STICK_HELD)

		unmount()

		expect(sentEvents()).toEqual([{ event: 'PositionChangeAbs', control: 'AbsoluteX', value: 0 }])
	})

	it('sends the neutral events once when blur is followed by a hidden tab', async () => {
		await engageAndPlay(STICK_HELD)

		await fireEvent.blur(window)
		await hideTab()

		expect(sentEvents()).toEqual([{ event: 'PositionChangeAbs', control: 'AbsoluteX', value: 0 }])
	})
})

describe('InputController.WebGamepad in a 320 px pane', () => {
	it('does not scroll horizontally', async () => {
		render(PaneSubject, { props: { widget: Subject } })
		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')

		expect(getComputedStyle(pane).width).toBe('320px')
		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})

describe('InputController.WebGamepad as a webgamepad in a 320 px pane', () => {
	it('does not scroll horizontally with the gamepad connected and forwarding', async () => {
		render(PaneSubject, { props: { widget: Subject, resourceName: 'webgamepad' } })
		await setGamepadConnected(true)
		await fireEvent.click(getToggle())
		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')

		expect(getToggle()).toHaveAttribute('aria-pressed', 'true')
		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
