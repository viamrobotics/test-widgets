import type { Component } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'

import GoForWidget from '../GoForView.svelte'
import GoToWidget from '../GoToView.svelte'
import MoveControl from '../MoveControl.svelte'
import QuickMoveWidget from '../QuickMoveWidget.svelte'
import ResetZeroPositionWidget from '../ResetZeroPositionWidget.svelte'
import SetPowerWidget from '../SetPowerWidget.svelte'
import SetRPMWidget from '../SetRpmWidget.svelte'
import Subject from './MotorPaneWidth.spec.svelte'

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		data: { positionReporting: true },
		isLoading: false,
		isSuccess: true,
		isError: false,
		error: null,
	})),
	createResourceMutation: vi.fn(() => ({
		mutate: vi.fn(),
		mutateAsync: vi.fn(),
		isPending: false,
		error: null,
	})),
}))

const PANE_WIDTH = '320px'

type MotorWidgetComponent = Component<{ partID: string; resourceName: string }>

const widgets: [name: string, widget: MotorWidgetComponent, heading: string][] = [
	['QuickMove', QuickMoveWidget, 'Quick move'],
	['Move', MoveControl, 'Move'],
	['SetPower', SetPowerWidget, 'SetPower'],
	['SetRpm', SetRPMWidget, 'SetRPM'],
	['GoFor', GoForWidget, 'GoFor'],
	['GoTo', GoToWidget, 'GoTo'],
	['ResetZeroPosition', ResetZeroPositionWidget, 'ResetZeroPosition'],
]

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

	it.each(widgets)('%s does not scroll horizontally', (_name, widget, heading) => {
		const { pane, root } = renderInPane(widget)

		expect(
			screen.queryAllByRole('heading', { name: heading }),
			'the section draws its own heading row'
		).toHaveLength(1)
		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
