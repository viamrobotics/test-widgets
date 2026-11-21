import '../../../../../app.css'

import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../gantry.svelte'
import InPane from './__fixtures__/in-320-pane.svelte'

const state = vi.hoisted(
	(): {
		calls: [string, unknown[]][]
		heldMethods: Set<string>
		heldCalls: { resolve: (value: unknown) => void }[]
	} => ({ calls: [], heldMethods: new Set(), heldCalls: [] })
)

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	const dataByMethod: Record<string, unknown> = {
		getPosition: [412.5, 86, 1234.56],
		getLengths: [1000, 600, 1500],
		isMoving: false,
	}
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceQuery: vi.fn((_client: unknown, method: string) => ({
			data: dataByMethod[method],
			isLoading: false,
			isSuccess: true,
			isError: false,
			error: null,
			refetch: vi.fn(),
		})),
		createResourceMutation: vi.fn((_client: unknown, method: string) => ({
			mutate: (args: unknown[]) => {
				state.calls.push([method, args])
			},
			mutateAsync: (args: unknown[]) => {
				state.calls.push([method, args])
				if (!state.heldMethods.has(method)) return Promise.resolve(true)
				return new Promise((resolve) => {
					state.heldCalls.push({ resolve })
				})
			},
			data: undefined,
			isPending: false,
			error: null,
		})),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

const MUTATOR_HEADINGS = ['Quick move', 'MoveToPosition', 'Home']
const SECTION_HEADINGS = ['IsMoving', 'Stop', ...MUTATOR_HEADINGS, 'GetPosition', 'GetLengths']

const isBefore = (first: Element, second: Element) =>
	(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0

const heading = (name: string) => screen.getByRole('heading', { name })

const renderAtWidth = (width: number) => {
	const target = document.createElement('div')
	target.style.width = `${width}px`
	document.body.append(target)
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-gantry' }, target })
	return target
}

const settleCalls = () => new Promise((resolve) => setTimeout(resolve, 0))

const resolveHeldCall = async () => {
	const call = state.heldCalls.shift()
	if (call === undefined) throw new Error('No held call to resolve')
	call.resolve(true)
	await settleCalls()
}

beforeEach(() => {
	state.calls = []
	state.heldMethods = new Set()
	state.heldCalls = []
})

afterEach(() => {
	document.body.replaceChildren()
})

describe('Gantry composite', () => {
	it('draws a heading for each mutator and query section, and none for IsMoving or Stop', () => {
		renderAtWidth(320)

		const counts = Object.fromEntries(
			SECTION_HEADINGS.map((name) => [name, screen.queryAllByRole('heading', { name }).length])
		)
		expect(counts).toEqual({
			IsMoving: 0,
			Stop: 0,
			'Quick move': 1,
			MoveToPosition: 1,
			Home: 1,
			GetPosition: 1,
			GetLengths: 1,
		})
	})

	it('draws the glance row as the IsMoving badge and the Stop button, with no heading row', () => {
		renderAtWidth(320)

		const glanceRow = within(screen.getByRole('group', { name: 'At a glance' }))
		expect(glanceRow.getByText('IsMoving')).toBeVisible()
		expect(glanceRow.getByText('Idle')).toBeVisible()
		expect(glanceRow.getByRole('button', { name: 'Stop' })).toBeVisible()
		expect(glanceRow.queryAllByRole('heading')).toEqual([])
	})

	it('puts the glance row first, then the mutators, then the queries', () => {
		renderAtWidth(320)

		const layers: [name: string, element: Element][] = [
			['glance row', screen.getByRole('group', { name: 'At a glance' })],
			...MUTATOR_HEADINGS.map((name): [string, Element] => [name, heading(name)]),
			['GetPosition', heading('GetPosition')],
			['GetLengths', heading('GetLengths')],
		]
		const inDocumentOrder = layers.toSorted(([, first], [, second]) =>
			isBefore(first, second) ? -1 : 1
		)
		expect(inDocumentOrder.map(([name]) => name)).toEqual([
			'glance row',
			'Quick move',
			'Home',
			'MoveToPosition',
			'GetPosition',
			'GetLengths',
		])
	})

	it('keeps the glance row on one row at 320 px', () => {
		renderAtWidth(320)

		const glanceRow = within(screen.getByRole('group', { name: 'At a glance' }))
		const badge = glanceRow.getByText('Idle').getBoundingClientRect()
		const stop = glanceRow.getByRole('button', { name: 'Stop' }).getBoundingClientRect()
		expect(stop.top, 'Stop starts above the badge bottom').toBeLessThan(badge.bottom)
		expect(badge.top, 'the badge starts above the Stop bottom').toBeLessThan(stop.bottom)
	})

	it('draws no sidebar and no Stop section', () => {
		renderAtWidth(320)

		expect(screen.queryByRole('heading', { name: 'Stop' })).not.toBeInTheDocument()
	})

	it('puts GetLengths beside GetPosition from 672 px', () => {
		renderAtWidth(672)

		const position = heading('GetPosition').getBoundingClientRect()
		const lengths = heading('GetLengths').getBoundingClientRect()
		expect(lengths.top).toBe(position.top)
		expect(lengths.left).toBeGreaterThan(position.right)
	})

	it('names the mutator and query layers as groups', () => {
		renderAtWidth(320)

		const mutators = within(screen.getByRole('group', { name: 'Mutators' }))
		const queries = within(screen.getByRole('group', { name: 'Queries' }))
		expect(mutators.getByRole('heading', { name: 'MoveToPosition' })).toBeVisible()
		expect(queries.getByRole('heading', { name: 'GetPosition' })).toBeVisible()
		expect(queries.getByRole('heading', { name: 'GetLengths' })).toBeVisible()
	})

	it('draws a divider between GetPosition and GetLengths, right edge of GetPosition at 700 px', () => {
		renderAtWidth(700)
		const [position, lengths] = [...screen.getByRole('group', { name: 'Queries' }).children]
		expect(getComputedStyle(position).borderRightWidth).toBe('1px')
		expect(getComputedStyle(lengths).borderRightWidth).toBe('0px')
	})

	it('draws a divider under GetPosition, above GetLengths, when stacked', () => {
		renderAtWidth(320)
		const [position, lengths] = [...screen.getByRole('group', { name: 'Queries' }).children]
		expect(getComputedStyle(position).borderBottomWidth).toBe('1px')
		expect(getComputedStyle(lengths).borderBottomWidth).toBe('0px')
	})

	it('stacks the mutators below 672 px', () => {
		renderAtWidth(671)

		const quick = heading('Quick move').getBoundingClientRect()
		const move = heading('MoveToPosition').getBoundingClientRect()
		expect(move.top).toBeGreaterThan(quick.bottom)
	})

	it('puts MoveToPosition in the right column, with Quick move over Home on the left, from 672 px', () => {
		renderAtWidth(672)

		const quick = heading('Quick move').getBoundingClientRect()
		const home = heading('Home').getBoundingClientRect()
		const move = heading('MoveToPosition').getBoundingClientRect()
		expect(move.top).toBe(quick.top)
		expect(move.left).toBeGreaterThan(quick.right)
		expect(home.top).toBeGreaterThan(quick.bottom)
		expect(home.left).toBe(quick.left)
	})
})

describe('Gantry composite in a 320 px pane', () => {
	it('does not scroll horizontally', () => {
		render(InPane, { props: { widget: Subject } })
		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')

		expect(getComputedStyle(pane).width).toBe('320px')
		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})

describe('Gantry composite conflict group', () => {
	it('sends nothing from a jog press while Home is in flight, then or after Home returns', async () => {
		const user = userEvent.setup()
		state.heldMethods = new Set(['home'])
		renderAtWidth(320)
		await user.click(screen.getByRole('button', { name: 'Home' }))

		await user.click(screen.getByRole('button', { name: '+10 mm, Axis 0' }))

		expect(state.calls, 'while Home is in flight').toEqual([['home', []]])
		expect(screen.getByTestId('status-line')).toHaveTextContent(
			'Homing. Steps resume when it finishes'
		)

		await resolveHeldCall()

		expect(state.calls, 'after Home returns').toEqual([['home', []]])
	})

	it('sends nothing from a Home press while a step is in flight, then or after the step returns', async () => {
		const user = userEvent.setup()
		state.heldMethods = new Set(['moveToPosition'])
		renderAtWidth(320)
		await user.click(screen.getByRole('button', { name: '+10 mm, Axis 0' }))
		const step = [
			'moveToPosition',
			[
				[422.5, 86, 1234.56],
				[50, 50, 50],
			],
		]

		await user.click(screen.getByRole('button', { name: 'Home' }))

		expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-disabled', 'true')
		expect(state.calls, 'while the step is in flight').toEqual([step])

		await resolveHeldCall()

		expect(state.calls, 'after the step returns').toEqual([step])
	})
})
