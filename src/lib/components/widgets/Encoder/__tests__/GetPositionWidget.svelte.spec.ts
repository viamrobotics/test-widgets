import '../../../../../app.css'

import { fireEvent, render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { EncoderPositionType } from '@viamrobotics/sdk'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../GetPositionWidget.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'

interface Properties {
	ticksCountSupported: boolean
	angleDegreesSupported: boolean
}

const { state } = vi.hoisted(() => {
	const hoisted: {
		properties: Properties | undefined
		position: [number, number] | undefined
		positionError: Error | null
		propertiesError: Error | null
	} = {
		properties: undefined,
		position: undefined,
		positionError: null,
		propertiesError: null,
	}
	return { state: hoisted }
})

vi.mock('@viamrobotics/sdk', () => ({
	EncoderClient: class {},
	EncoderPositionType: { UNSPECIFIED: 0, TICKS_COUNT: 1, ANGLE_DEGREES: 2 },
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn((_client: unknown, method: string) =>
		method === 'getProperties'
			? {
					data: state.properties,
					isLoading: false,
					isError: state.propertiesError !== null,
					error: state.propertiesError,
				}
			: {
					data: state.position,
					isLoading: false,
					isError: state.positionError !== null,
					error: state.positionError,
				}
	),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-encoder' },
	})

const positionCall = () => {
	const call = vi
		.mocked(createResourceQuery)
		.mock.calls.find(([, method]: readonly unknown[]) => method === 'getPosition')
	if (!call) {
		throw new Error('getPosition query was not created')
	}
	return call
}

const positionOptions = () => {
	const options = positionCall()[3]
	if (typeof options !== 'function') {
		throw new TypeError('getPosition options are not a function')
	}
	return options()
}

const positionArgs = () => {
	const args = positionCall()[2]
	if (typeof args !== 'function') {
		throw new TypeError('getPosition args are not a function')
	}
	return args()
}

describe('Encoder GetPosition widget', () => {
	beforeEach(() => {
		state.properties = undefined
		state.position = undefined
		state.positionError = null
		state.propertiesError = null
		vi.mocked(createResourceQuery).mockClear()
		localStorage.clear()
	})

	it('renders the GetPosition section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetPosition' })).toBeInTheDocument()
	})

	it('renders an angle position in degrees with one decimal', () => {
		state.position = [123.456, EncoderPositionType.ANGLE_DEGREES]

		renderSubject()

		expect(screen.getByText('123.5')).toBeInTheDocument()
		expect(screen.getByText('°')).toBeInTheDocument()
	})

	it('renders a ticks position with two decimals and a ticks unit', () => {
		state.position = [987.654, 1]

		renderSubject()

		expect(screen.getByText('987.65')).toBeInTheDocument()
		expect(screen.getByText('ticks')).toBeInTheDocument()
	})

	it('reads getProperties once, with no poll', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getProperties', {
			refetchInterval: false,
		})
	})

	it('polls getPosition every second until Pause is pressed', async () => {
		state.properties = { ticksCountSupported: true, angleDegreesSupported: false }
		renderSubject()

		expect(positionOptions().refetchInterval).toBe(1000)
		expect(screen.getByText('Updates')).toBeInTheDocument()

		await userEvent.click(screen.getByRole('button', { name: 'Pause' }))

		expect(positionOptions().refetchInterval).toBe(false)
		expect(screen.getByText('Paused')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
	})

	it('shows the type the properties picked in the Position type field', () => {
		state.properties = { ticksCountSupported: true, angleDegreesSupported: false }

		renderSubject()

		expect(screen.getByRole('combobox', { name: 'Position type' })).toHaveTextContent('Ticks count')
	})

	it('requests the type the person picks, over the one the properties picked', async () => {
		state.properties = { ticksCountSupported: true, angleDegreesSupported: true }
		renderSubject()
		expect(positionArgs()).toEqual([2])

		await userEvent.click(screen.getByRole('combobox', { name: 'Position type' }))
		await userEvent.click(await screen.findByRole('option', { name: 'Ticks count' }))

		expect(positionArgs()).toEqual([1])
	})

	it('requests the unspecified type the field shows when the properties fail to load', () => {
		state.propertiesError = new Error('unimplemented')

		renderSubject()

		expect(screen.getByRole('combobox', { name: 'Position type' })).toHaveTextContent('Unspecified')
		expect(positionArgs()).toEqual([0])
		expect(positionOptions().enabled).toBe(true)
	})

	it('enables getPosition for a picked type when the properties never load', async () => {
		renderSubject()
		expect(positionOptions().enabled).toBe(false)

		await userEvent.click(screen.getByRole('combobox', { name: 'Position type' }))
		await userEvent.click(await screen.findByRole('option', { name: 'Angle degrees' }))

		expect(positionArgs()).toEqual([2])
		expect(positionOptions().enabled).toBe(true)
	})

	it('keeps getPosition disabled until properties have loaded', () => {
		renderSubject()

		expect(positionOptions().enabled).toBe(false)
	})

	it('enables getPosition once properties have loaded', () => {
		state.properties = { ticksCountSupported: true, angleDegreesSupported: false }

		renderSubject()

		expect(positionOptions().enabled).toBe(true)
	})

	it('requests degrees when the encoder supports angle degrees', () => {
		state.properties = { ticksCountSupported: true, angleDegreesSupported: true }

		renderSubject()

		expect(positionArgs()).toEqual([2])
	})

	it('requests ticks when the encoder supports only ticks', () => {
		state.properties = { ticksCountSupported: true, angleDegreesSupported: false }

		renderSubject()

		expect(positionArgs()).toEqual([1])
	})

	it("shows the query error in the section's error indicator", async () => {
		state.positionError = new Error('encoder position unavailable')

		renderSubject()
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'GetPosition: 1 error, copy to clipboard' })
		)

		expect(screen.getByText(/encoder position unavailable/iu)).toBeInTheDocument()
	})
})

const PANE_WIDTH = '320px'

const renderInPane = () => {
	render(PaneSubject, { props: { widget: Subject } })
	const pane = screen.getByTestId('pane')
	const root = pane.firstElementChild
	if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')
	return { pane, root }
}

describe('Encoder GetPosition widget in a 320 px pane', () => {
	beforeEach(() => {
		state.properties = undefined
		state.position = undefined
		state.positionError = null
	})

	it('loads the app stylesheet, so the pane takes its utility width', () => {
		const { pane } = renderInPane()

		expect(getComputedStyle(pane).width).toBe(PANE_WIDTH)
	})

	it('does not scroll horizontally', () => {
		state.position = [123456.789, 1]
		const { pane, root } = renderInPane()

		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
