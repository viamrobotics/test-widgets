import type { Component } from 'svelte'

import { render, screen, within } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import GetPropertiesWidget from '../get-properties-widget.svelte'
import GoForWidget from '../go-for-view.svelte'
import GoToWidget from '../go-to-view.svelte'
import IsMovingWidget from '../is-moving-widget.svelte'
import MotorWidget from '../motor.svelte'
import QuickMoveWidget from '../quick-move-widget.svelte'
import ResetZeroPositionWidget from '../reset-zero-position-widget.svelte'
import SetPowerWidget from '../set-power-widget.svelte'
import SetRPMWidget from '../set-rpm-widget.svelte'
import Subject from './motor-pane-width.spec.svelte'

const propertiesState = vi.hoisted((): { positionReporting: boolean; error: Error | null } => ({
	positionReporting: true,
	error: null,
}))

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	const dataByMethod = (method: string): unknown => {
		if (method === 'getProperties') {
			return propertiesState.error === null
				? { positionReporting: propertiesState.positionReporting }
				: undefined
		}
		if (method === 'isPowered') return [true, 0.5]
		if (method === 'getPosition') return 12.3456
		if (method === 'isMoving') return true
		return undefined
	}
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceQuery: vi.fn((_client: unknown, method: string) => ({
			data: dataByMethod(method),
			isLoading: false,
			isSuccess: method !== 'getProperties' || propertiesState.error === null,
			isError: method === 'getProperties' && propertiesState.error !== null,
			error: method === 'getProperties' ? propertiesState.error : null,
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
	[
		'the composite',
		MotorWidget,
		{ 'Quick move': 1, IsPowered: 1, ResetZeroPosition: 1, GetPosition: 1 },
	],
	['quick move', QuickMoveWidget, { 'Quick move': 1 }],
	['SetPower', SetPowerWidget, { SetPower: 1 }],
	['SetRPM', SetRPMWidget, { SetRPM: 1 }],
	['GoFor', GoForWidget, { GoFor: 1 }],
	['GoTo', GoToWidget, { GoTo: 1 }],
	['IsMoving', IsMovingWidget, { IsMoving: 1 }],
	['ResetZeroPosition', ResetZeroPositionWidget, { ResetZeroPosition: 1 }],
	['GetProperties', GetPropertiesWidget, { GetProperties: 1 }],
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

describe('Motor composite readouts', () => {
	beforeEach(() => {
		propertiesState.positionReporting = true
		propertiesState.error = null
	})

	it('draws the power percent in a readout-value with the status dot beside it', () => {
		renderInPane(MotorWidget)

		const value = screen.getByText('50.0%')
		expect(value).toHaveClass('readout-value')
		expect(screen.getByRole('img', { name: 'Powered' })).toBeInTheDocument()
		expect(value).not.toContainElement(screen.getByRole('img', { name: 'Powered' }))
	})

	it('names the power row Power, with the percent inside its group', () => {
		renderInPane(MotorWidget)

		const power = within(screen.getByRole('group', { name: 'Power' }))
		expect(power.getByText('50.0%')).toHaveClass('readout-value')
	})

	it('draws the position in a readout-value with no rev suffix', () => {
		renderInPane(MotorWidget)

		const section = within(
			screen.getByRole('heading', { name: 'GetPosition' }).closest('section') ?? document.body
		)
		expect(section.getByText('12.3456')).toHaveClass('readout-value')
		expect(section.queryByText('rev')).not.toBeInTheDocument()
	})

	it('names the position readout Position and the glance column At a glance', () => {
		renderInPane(MotorWidget)

		const position = within(screen.getByRole('group', { name: 'Position' }))
		expect(position.getByText('12.3456')).toHaveClass('readout-value')
		const glance = within(screen.getByRole('group', { name: 'At a glance' }))
		expect(glance.getByRole('button', { name: 'Stop' })).toBeInTheDocument()
	})

	it('draws no GetPosition section when the motor reports no position', () => {
		propertiesState.positionReporting = false

		renderInPane(MotorWidget)

		expect(screen.queryByRole('heading', { name: 'GetPosition' })).not.toBeInTheDocument()
		expect(screen.queryByText('12.3456')).not.toBeInTheDocument()
	})

	it('reaches an error indicator when GetProperties fails', () => {
		propertiesState.error = new Error('properties unavailable')

		renderInPane(MotorWidget)

		expect(
			screen.getByRole('button', { name: 'IsPowered: 1 error, copy to clipboard' })
		).toBeInTheDocument()
		expect(screen.queryByRole('heading', { name: 'GetPosition' })).not.toBeInTheDocument()
	})
})
