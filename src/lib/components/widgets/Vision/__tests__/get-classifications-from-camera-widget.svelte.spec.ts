import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { Classification } from '@viamrobotics/sdk'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../get-classifications-from-camera-widget.svelte'

const state = vi.hoisted((): { data: Record<string, unknown>; cameras: string[] } => ({
	data: {},
	cameras: [],
}))

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceQuery: vi.fn((_client: unknown, method: string) => ({
			get data() {
				return state.data[method]
			},
			isLoading: false,
			isSuccess: true,
			isError: false,
			isFetching: false,
			fetchStatus: 'idle',
			error: null,
			refetch: vi.fn(),
		})),
		useResourceStatuses: vi.fn(() => ({
			get current() {
				return state.cameras.map((name) => ({ name: { name } }))
			},
		})),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

const PROPS = { partID: 'test-part', resourceName: 'test-vision' }

const callIfFunction = (value: unknown): unknown => (typeof value === 'function' ? value() : value)

const getQuery = (method: string) => {
	const call = vi.mocked(createResourceQuery).mock.calls.findLast(([, name]) => name === method)
	if (call === undefined) throw new Error(`No query was created for ${method}`)
	return { args: callIfFunction(call[2]), options: callIfFunction(call[3]) }
}

const typeCount = async (text: string) => {
	const field = screen.getByRole('spinbutton', { name: 'Count' })
	await userEvent.clear(field)
	await userEvent.type(field, text)
}

describe('GetClassificationsFromCamera widget', () => {
	beforeEach(() => {
		state.data = {}
		state.cameras = []
	})

	it('polls GetClassificationsFromCamera every 500 ms', () => {
		render(Subject, { props: PROPS })

		expect(getQuery('getClassificationsFromCamera').options).toMatchObject({
			enabled: true,
			refetchInterval: 500,
		})
	})

	it("sends the Camera row's camera with a Count of 3 to start", () => {
		state.cameras = ['cam-1']

		render(Subject, { props: PROPS })

		expect(screen.getByRole('spinbutton', { name: 'Count' })).toHaveValue(3)
		expect(getQuery('getClassificationsFromCamera').args).toEqual(['cam-1', 3])
	})

	it('sends the Count as n', async () => {
		render(Subject, { props: PROPS })

		await typeCount('7')

		expect(getQuery('getClassificationsFromCamera').args).toEqual(['', 7])
	})

	it('stops polling while the Count is not a whole number of at least one', async () => {
		render(Subject, { props: PROPS })

		await typeCount('0')

		expect(getQuery('getClassificationsFromCamera').options).toMatchObject({ enabled: false })
	})

	it('hides the Camera row and sends the cameraName it is given', () => {
		state.cameras = ['cam-1']

		render(Subject, { props: { ...PROPS, cameraName: 'cam-2' } })

		expect(screen.queryByRole('combobox', { name: 'Camera' })).not.toBeInTheDocument()
		expect(getQuery('getClassificationsFromCamera').args).toEqual(['cam-2', 3])
	})

	it('draws a row for each classification in the response', () => {
		state.data.getClassificationsFromCamera = [
			new Classification({ className: 'tabby cat', confidence: 0.912 }),
		]

		render(Subject, { props: PROPS })

		expect(
			within(screen.getByRole('list', { name: 'Classifications' })).getByRole('listitem')
		).toHaveTextContent('tabby cat 91.20 %')
	})

	it('reads - before any classifications arrive', () => {
		render(Subject, { props: PROPS })

		expect(screen.getByRole('group', { name: 'Classifications' })).toHaveTextContent(
			'Classifications -'
		)
	})
})
