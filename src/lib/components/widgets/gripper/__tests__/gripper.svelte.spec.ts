import { render, screen, within } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Subject from '../gripper.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	const dataByMethod: Record<string, unknown> = {
		isMoving: false,
		isHoldingSomething: false,
		getCurrentInputs: [0.62, 0.38],
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
		createResourceMutation: vi.fn(() => ({
			mutate: vi.fn(),
			mutateAsync: vi.fn(() => Promise.resolve(true)),
			isPending: false,
			error: null,
		})),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

const isBefore = (first: Element, second: Element) =>
	(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0

const renderAtWidth = (width: number) => {
	const target = document.createElement('div')
	target.style.width = `${width}px`
	document.body.append(target)
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-gripper' }, target })
	return target
}

afterEach(() => {
	document.body.replaceChildren()
})

describe('Gripper composite', () => {
	it('draws a heading for each mutator and query, none for IsMoving, IsHoldingSomething, or Stop', () => {
		renderAtWidth(320)

		const counts = Object.fromEntries(
			[
				'Open / Grab',
				'GoToInputs',
				'GetCurrentInputs',
				'IsMoving',
				'IsHoldingSomething',
				'Stop',
			].map((name) => [name, screen.queryAllByRole('heading', { name }).length])
		)
		expect(counts).toEqual({
			'Open / Grab': 1,
			GoToInputs: 1,
			GetCurrentInputs: 1,
			IsMoving: 0,
			IsHoldingSomething: 0,
			Stop: 0,
		})
	})

	it('draws the glance row as both badges and the Stop button, with no heading row', () => {
		renderAtWidth(320)

		const glanceRow = within(screen.getByRole('group', { name: 'At a glance' }))
		expect(glanceRow.getByText('IsMoving')).toBeVisible()
		expect(glanceRow.getByText('Idle')).toBeVisible()
		expect(glanceRow.getByText('IsHoldingSomething')).toBeVisible()
		expect(glanceRow.getByText('Empty')).toBeVisible()
		expect(glanceRow.getByRole('button', { name: 'Stop' })).toBeVisible()
		expect(glanceRow.queryAllByRole('heading')).toEqual([])
	})

	it('puts the glance row before the mutators', () => {
		renderAtWidth(320)

		const glanceRow = screen.getByRole('group', { name: 'At a glance' })
		const mutators = screen.getByRole('group', { name: 'Mutators' })
		expect(isBefore(glanceRow, mutators)).toBe(true)
		expect(within(mutators).getByRole('heading', { name: 'Open / Grab' })).toBeVisible()
	})

	it('puts GoToInputs among the mutators and GetCurrentInputs in the queries after them', () => {
		renderAtWidth(320)

		const mutators = screen.getByRole('group', { name: 'Mutators' })
		const queries = screen.getByRole('group', { name: 'Queries' })
		expect(within(mutators).getByRole('heading', { name: 'GoToInputs' })).toBeVisible()
		expect(within(queries).getByRole('heading', { name: 'GetCurrentInputs' })).toBeVisible()
		expect(isBefore(mutators, queries)).toBe(true)
	})

	it('draws Open / Grab beside GoToInputs from 672 px, and stacked under it', () => {
		const wide = renderAtWidth(700)
		const wideTops = ['Open / Grab', 'GoToInputs'].map(
			(name) => within(wide).getByRole('heading', { name }).getBoundingClientRect().top
		)
		expect(wideTops[0]).toBe(wideTops[1])
		document.body.replaceChildren()

		const narrow = renderAtWidth(320)
		const narrowTops = ['Open / Grab', 'GoToInputs'].map(
			(name) => within(narrow).getByRole('heading', { name }).getBoundingClientRect().top
		)
		expect(narrowTops[0]).toBeLessThan(narrowTops[1] ?? 0)
	})

	it('stops growing at 688 px', () => {
		const target = renderAtWidth(900)

		const group = target.querySelector('.max-w-172')
		expect(group?.getBoundingClientRect().width).toBe(688)
	})
})

describe('Gripper composite in a 320 px pane', () => {
	it('does not scroll horizontally', () => {
		render(PaneSubject, { props: { widget: Subject } })
		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')

		expect(getComputedStyle(pane).width).toBe('320px')
		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
