import '../../../../../app.css'

import { render, screen, within } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'

import BaseWidget from '../base.svelte'
import InPane from './__fixtures__/in-320-pane.svelte'

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	const dataByMethod: Record<string, unknown> = {
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
		createResourceMutation: vi.fn(() => ({
			mutate: vi.fn(),
			mutateAsync: vi.fn(async () => undefined),
			isPending: false,
			error: null,
		})),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

const MUTATOR_HEADINGS = ['Spin', 'MoveStraight', 'Quick move', 'SetPower', 'SetVelocity']
const QUERY_HEADINGS = ['GetProperties']

const isBefore = (first: Element, second: Element) =>
	(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0

const headingBox = (name: string) => screen.getByRole('heading', { name }).getBoundingClientRect()

const renderAtWidth = (width: number) => {
	const target = document.createElement('div')
	target.style.width = `${width}px`
	document.body.append(target)
	render(BaseWidget, { props: { partID: 'test-part', resourceName: 'test-base' }, target })
}

afterEach(() => {
	document.body.replaceChildren()
})

describe('Base composite', () => {
	it('draws a heading for each mutator and query, and none for IsMoving or Stop', () => {
		renderAtWidth(320)

		const counts = Object.fromEntries(
			['IsMoving', 'Stop', ...MUTATOR_HEADINGS, ...QUERY_HEADINGS].map((name) => [
				name,
				screen.queryAllByRole('heading', { name }).length,
			])
		)
		expect(counts).toEqual({
			IsMoving: 0,
			Stop: 0,
			Spin: 1,
			MoveStraight: 1,
			'Quick move': 1,
			SetPower: 1,
			SetVelocity: 1,
			GetProperties: 1,
		})
	})

	it('draws the glance row as the IsMoving badge and the Stop button', () => {
		renderAtWidth(320)

		const glanceRow = within(screen.getByRole('group', { name: 'At a glance' }))
		expect(glanceRow.getByText('IsMoving')).toBeVisible()
		expect(glanceRow.getByText('Idle')).toBeVisible()
		expect(glanceRow.getByRole('button', { name: 'Stop' })).toBeVisible()
	})

	it('gives each glance item its own error indicator', () => {
		renderAtWidth(320)

		const glanceRow = within(screen.getByRole('group', { name: 'At a glance' }))
		expect(glanceRow.getAllByRole('button', { name: /: No errors$/u })).toHaveLength(2)
	})

	it('puts the glance row first, then the mutators with Quick move in the third slot, then the query', () => {
		renderAtWidth(320)

		const layers: [name: string, element: Element][] = [
			['glance row', screen.getByRole('group', { name: 'At a glance' })],
			...MUTATOR_HEADINGS.map((name): [string, Element] => [
				name,
				screen.getByRole('heading', { name }),
			]),
			...QUERY_HEADINGS.map((name): [string, Element] => [
				name,
				screen.getByRole('heading', { name }),
			]),
		]
		const inDocumentOrder = layers.toSorted(([, first], [, second]) =>
			isBefore(first, second) ? -1 : 1
		)
		expect(inDocumentOrder.map(([name]) => name)).toEqual([
			'glance row',
			'Spin',
			'MoveStraight',
			'Quick move',
			'SetPower',
			'SetVelocity',
			'GetProperties',
		])
	})

	it('holds GetProperties alone in the Queries group, under the mutators', () => {
		renderAtWidth(320)

		const queries = within(screen.getByRole('group', { name: 'Queries' }))
		expect(queries.getByRole('heading', { name: 'GetProperties' })).toBeVisible()
		expect(headingBox('GetProperties').top).toBeGreaterThan(headingBox('SetVelocity').bottom)
	})

	it('holds every mutator in the Mutators group', () => {
		renderAtWidth(320)

		const mutators = within(screen.getByRole('group', { name: 'Mutators' }))
		expect(
			MUTATOR_HEADINGS.filter((name) => mutators.queryByRole('heading', { name }) === null)
		).toEqual([])
	})

	it('keeps the glance row on one row at 320 px', () => {
		renderAtWidth(320)

		const glanceRow = within(screen.getByRole('group', { name: 'At a glance' }))
		const badge = glanceRow.getByText('Idle').getBoundingClientRect()
		const stop = glanceRow.getByRole('button', { name: 'Stop' }).getBoundingClientRect()
		expect(stop.top, 'Stop starts above the badge bottom').toBeLessThan(badge.bottom)
		expect(badge.top, 'the badge starts above the Stop bottom').toBeLessThan(stop.bottom)
	})

	it('names the glance row At a glance, not Status and stop', () => {
		renderAtWidth(320)

		expect(screen.queryByRole('group', { name: 'Status and stop' })).not.toBeInTheDocument()
	})

	it('stacks the mutators in one column below 672 px', () => {
		renderAtWidth(671)

		const spin = headingBox('Spin')
		const moveStraight = headingBox('MoveStraight')
		expect(moveStraight.top).toBeGreaterThan(spin.bottom)
		expect(moveStraight.left).toBe(spin.left)
	})

	it('puts the mutators in two columns from 672 px, Quick move beside SetPower', () => {
		renderAtWidth(672)

		const spin = headingBox('Spin')
		const moveStraight = headingBox('MoveStraight')
		const quickMove = headingBox('Quick move')
		const setPower = headingBox('SetPower')
		expect(moveStraight.top, 'Spin and MoveStraight share a row').toBe(spin.top)
		expect(moveStraight.left, 'MoveStraight is right of Spin').toBeGreaterThan(spin.right)
		expect(setPower.top, 'Quick move and SetPower share a row').toBe(quickMove.top)
		expect(quickMove.top, 'the second row is below the first').toBeGreaterThan(spin.bottom)
	})

	it('puts the mutators in three columns from 896 px, Quick move third on the first row', () => {
		renderAtWidth(896)

		const spin = headingBox('Spin')
		const quickMove = headingBox('Quick move')
		const setPower = headingBox('SetPower')
		expect(quickMove.top, 'Quick move shares the first row').toBe(spin.top)
		expect(setPower.top, 'SetPower starts the second row').toBeGreaterThan(spin.bottom)
		expect(setPower.left, 'SetPower is in the first column').toBe(spin.left)
	})
})

describe('Base composite dividers at 700 px', () => {
	const cellOf = (name: string) => {
		const cell = [...screen.getByRole('group', { name: 'Mutators' }).children].find(
			(child) =>
				child instanceof HTMLElement && within(child).queryByRole('heading', { name }) !== null
		)
		if (cell === undefined) throw new Error(`${name} has no cell`)
		return cell
	}

	it('draws a left divider on the second column and a top divider on the second row', () => {
		renderAtWidth(700)

		expect(getComputedStyle(cellOf('Spin')).borderLeftWidth).toBe('0px')
		expect(getComputedStyle(cellOf('MoveStraight')).borderLeftWidth).toBe('1px')
		expect(getComputedStyle(cellOf('Spin')).borderTopWidth).toBe('0px')
		expect(getComputedStyle(cellOf('MoveStraight')).borderTopWidth).toBe('0px')
		expect(getComputedStyle(cellOf('Quick move')).borderTopWidth).toBe('1px')
		expect(getComputedStyle(cellOf('Quick move')).borderLeftWidth).toBe('0px')
		expect(getComputedStyle(cellOf('SetPower')).borderLeftWidth).toBe('1px')
		expect(getComputedStyle(cellOf('SetPower')).borderTopWidth).toBe('1px')
		expect(getComputedStyle(cellOf('SetVelocity')).borderTopWidth).toBe('1px')
		expect(getComputedStyle(cellOf('SetVelocity')).borderLeftWidth).toBe('0px')
	})

	it('colors the dividers with the border-light token', () => {
		renderAtWidth(700)

		const probe = document.createElement('div')
		probe.className = 'border border-light'
		document.body.append(probe)
		const expected = getComputedStyle(probe).borderTopColor
		probe.remove()

		expect(getComputedStyle(cellOf('MoveStraight')).borderLeftColor).toBe(expected)
		expect(getComputedStyle(cellOf('Quick move')).borderTopColor).toBe(expected)
	})
})

describe('Base composite in a 320 px pane', () => {
	it('does not scroll horizontally', () => {
		render(InPane, { props: { widget: BaseWidget } })
		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')

		expect(getComputedStyle(pane).width).toBe('320px')
		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
