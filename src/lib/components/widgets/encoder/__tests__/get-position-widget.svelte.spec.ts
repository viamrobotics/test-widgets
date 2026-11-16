import { fireEvent, render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../get-position-widget.svelte'

interface Properties {
	ticksCountSupported: boolean
	angleDegreesSupported: boolean
}

const { state } = vi.hoisted(() => {
	const hoisted: {
		properties: Properties | undefined
		position: [number, number] | undefined
		positionError: Error | null
	} = {
		properties: undefined,
		position: undefined,
		positionError: null,
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
					isError: false,
					error: null,
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
		.mock.calls.find(([, method]) => method === 'getPosition')
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
		vi.mocked(createResourceQuery).mockClear()
	})

	it('renders the GetPosition section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetPosition' })).toBeInTheDocument()
	})

	it('renders an angle position in degrees with one decimal', () => {
		state.position = [123.456, 2]

		renderSubject()

		expect(screen.getByText('123.5')).toBeInTheDocument()
		expect(screen.getByText('º')).toBeInTheDocument()
	})

	it('renders a ticks position with two decimals and a ticks unit', () => {
		state.position = [987.654, 1]

		renderSubject()

		expect(screen.getByText('987.65')).toBeInTheDocument()
		expect(screen.getByText('ticks')).toBeInTheDocument()
	})

	it('polls getProperties every 500 ms', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getProperties', {
			refetchInterval: 500,
		})
	})

	it('polls getPosition every 500 ms', () => {
		renderSubject()

		expect(positionOptions().refetchInterval).toBe(500)
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
		await fireEvent.focus(screen.getByRole('button', { name: '1 error, copy to clipboard' }))

		expect(screen.getByText(/encoder position unavailable/iu)).toBeInTheDocument()
	})
})
