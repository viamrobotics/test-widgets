import '../../../../../app.css'

import { render, screen, within } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Subject from '../servo.svelte'
import InPane from './__fixtures__/in-320-pane.svelte'

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	const dataByMethod: Record<string, unknown> = {
		getPosition: 90,
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
		})),
		createResourceMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false, error: null })),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

const MUTATOR_HEADINGS = ['Move', 'Quick move']
const SECTION_HEADINGS = ['IsMoving', 'Stop', ...MUTATOR_HEADINGS, 'GetPosition']

const isBefore = (first: Element, second: Element) =>
	(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0

const heading = (name: string) => screen.getByRole('heading', { name })

const renderAtWidth = (width: number) => {
	const target = document.createElement('div')
	target.style.width = `${width}px`
	document.body.append(target)
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-servo' }, target })
	return target
}

afterEach(() => {
	document.body.replaceChildren()
})

describe('Servo composite', () => {
	it('draws a heading for each mutator and query section, and none for IsMoving or Stop', () => {
		renderAtWidth(320)

		const counts = Object.fromEntries(
			SECTION_HEADINGS.map((name) => [name, screen.queryAllByRole('heading', { name }).length])
		)
		expect(counts).toEqual({
			IsMoving: 0,
			Stop: 0,
			Move: 1,
			'Quick move': 1,
			GetPosition: 1,
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

	it('puts the glance row first, then the mutators, then the query', () => {
		renderAtWidth(320)

		const layers: [name: string, element: Element][] = [
			['glance row', screen.getByRole('group', { name: 'At a glance' })],
			...MUTATOR_HEADINGS.map((name): [string, Element] => [name, heading(name)]),
			['GetPosition', heading('GetPosition')],
		]
		const inDocumentOrder = layers.toSorted(([, first], [, second]) =>
			isBefore(first, second) ? -1 : 1
		)
		expect(inDocumentOrder.map(([name]) => name)).toEqual([
			'glance row',
			'Move',
			'Quick move',
			'GetPosition',
		])
	})

	it('stacks the mutators below 672 px', () => {
		renderAtWidth(671)

		const move = heading('Move').getBoundingClientRect()
		const quick = heading('Quick move').getBoundingClientRect()
		expect(quick.top).toBeGreaterThan(move.bottom)
	})

	it('puts Move and Quick move side by side from 672 px', () => {
		renderAtWidth(672)

		const move = heading('Move').getBoundingClientRect()
		const quick = heading('Quick move').getBoundingClientRect()
		expect(quick.top).toBe(move.top)
		expect(quick.left).toBeGreaterThan(move.right)
	})

	it('stops growing at 688 px', () => {
		const target = renderAtWidth(900)

		const group = target.querySelector('.max-w-172')
		expect(group?.getBoundingClientRect().width).toBe(688)
	})
})

describe('Servo composite in a 320 px pane', () => {
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
