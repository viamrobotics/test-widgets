import type { Component } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'

import GoForWidget from '../go-for-view.svelte'
import GoToWidget from '../go-to-view.svelte'
import IsMovingWidget from '../is-moving-widget.svelte'
import MotorWidget from '../motor.svelte'
import QuickMoveWidget from '../quick-move-widget.svelte'
import SetPowerWidget from '../set-power-widget.svelte'
import SetRPMWidget from '../set-rpm-widget.svelte'
import Subject from './motor-pane-width.spec.svelte'

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	// Position reporting on, so the composite draws every section it can.
	const dataByMethod: Record<string, unknown> = {
		getProperties: { positionReporting: true },
		isPowered: [true, 0.5],
		getPosition: 12.3456,
		isMoving: true,
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

const PANE_WIDTH = '320px'

type MotorWidgetComponent = Component<{ partID: string; resourceName: string }>

const widgets: [
	name: string,
	widget: MotorWidgetComponent,
	headingCounts: Record<string, number>,
][] = [
	['the composite', MotorWidget, { IsPowered: 1, GetPosition: 1 }],
	['quick move', QuickMoveWidget, { SetPower: 1 }],
	['SetPower', SetPowerWidget, { SetPower: 1 }],
	['SetRPM', SetRPMWidget, { SetRPM: 1 }],
	['GoFor', GoForWidget, { GoFor: 1 }],
	['GoTo', GoToWidget, { GoTo: 1 }],
	['IsMoving', IsMovingWidget, { IsMoving: 1 }],
]

const countHeadings = (names: string[]) =>
	Object.fromEntries(names.map((name) => [name, screen.queryAllByRole('heading', { name }).length]))

const renderInPane = (widget: MotorWidgetComponent) => {
	render(Subject, { props: { widget } })
	const pane = screen.getByTestId('pane')
	const root = pane.firstElementChild
	if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')
	return { pane, root }
}

describe('Motor widgets in a 320 px pane', () => {
	it('loads the app stylesheet, so the pane takes its utility width', () => {
		const { pane } = renderInPane(SetPowerWidget)

		expect(getComputedStyle(pane).width).toBe(PANE_WIDTH)
	})

	it.each(widgets)('%s does not scroll horizontally', (_name, widget, headingCounts) => {
		const { pane, root } = renderInPane(widget)

		expect(
			countHeadings(Object.keys(headingCounts)),
			'each section draws its own heading row, not an error boundary or a folded scope'
		).toEqual(headingCounts)
		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
