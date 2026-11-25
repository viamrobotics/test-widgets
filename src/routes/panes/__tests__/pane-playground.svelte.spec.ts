import { render, screen, waitFor, within } from '@testing-library/svelte'
import { userEvent } from '@testing-library/user-event'
import { robotApi } from '@viamrobotics/sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../pane-playground.svelte'

vi.mock('$lib/resource-widgets', async () => {
	const { stubWidgetsForResource } = await import('./__fixtures__/stub-widgets-for-resource')
	return { widgetsForResource: stubWidgetsForResource }
})

const resourceStatus = (name: string, subtype: string, type = 'component') => ({
	name: { name, namespace: 'rdk', type, subtype },
	state: robotApi.ResourceStatus_State.READY,
	revision: '1',
	error: '',
})

vi.mock('@viamrobotics/svelte-sdk', async (importOriginal) => ({
	...(await importOriginal<typeof import('@viamrobotics/svelte-sdk')>()),
	useConnectionStatus: () => ({ current: 'connected' }),
	useResourceStatuses: () => ({ current: [] }),
	useMachineStatus: () => ({
		query: { isPending: false, error: null },
		current: {
			resources: [
				resourceStatus('motor-1', 'motor'),
				resourceStatus('motor-2', 'motor'),
				resourceStatus('arm-1', 'arm'),
				resourceStatus('motion-1', 'motion', 'service'),
				resourceStatus('base-1', 'base'),
				resourceStatus('gantry-1', 'gantry'),
				resourceStatus('servo-1', 'servo'),
				resourceStatus('gripper-1', 'gripper'),
				resourceStatus('board-1', 'board'),
				resourceStatus('switch-1', 'switch'),
				resourceStatus('button-1', 'button'),
				resourceStatus('sensor-1', 'sensor'),
				resourceStatus('movement-sensor-1', 'movement_sensor'),
				resourceStatus('power-sensor-1', 'power_sensor'),
				resourceStatus('encoder-1', 'encoder'),
				resourceStatus('input-controller-1', 'input_controller'),
				resourceStatus('audio-input-1', 'audio_in'),
				resourceStatus('audio-output-1', 'audio_out'),
				resourceStatus('discovery-1', 'discovery', 'service'),
				resourceStatus('ml-model-1', 'mlmodel', 'service'),
			],
		},
	}),
}))

const paneHeader = (paneId: string) => {
	const header = document.querySelector(`[data-pane-id="${paneId}"] [data-pane-header]`)
	if (!(header instanceof HTMLElement)) throw new Error(`No header for pane ${paneId}`)
	return within(header)
}

const flatText = (element: Element) => element.textContent?.replaceAll(/\s+/gu, ' ').trim()

const renderSubject = () => render(Subject, { partID: 'part-1' })

describe('Pane playground', () => {
	it("lays the first motor's widgets out as a split, a stack, and a float", () => {
		renderSubject()

		expect(screen.getAllByRole('separator', { name: 'Resize panes' })).toHaveLength(2)
		expect(paneHeader('motor-1::quickMove').getByRole('heading', { name: 'motor-1' })).toBeVisible()

		const tabs = within(screen.getByRole('tablist', { name: 'Stacked panes' })).getAllByRole('tab')
		expect(tabs.map((tab) => flatText(tab))).toEqual([
			'motor-1 SetRPM',
			'motor-1 GoFor',
			'motor-1 GoTo',
		])

		const isMoving = paneHeader('motor-1::isMoving')
		expect(isMoving.getByRole('button', { name: 'Dock motor-1 IsMoving' })).toBeVisible()
		expect(isMoving.getByRole('button', { name: 'Close motor-1 IsMoving' })).toBeVisible()
	})

	it('titles a control with the resource alone and keeps the indicator out of its header', () => {
		renderSubject()

		const quickMove = paneHeader('motor-1::quickMove')
		expect(quickMove.queryByRole('link', { name: /docs/u })).not.toBeInTheDocument()
		expect(quickMove.queryByRole('button', { name: /error/u })).not.toBeInTheDocument()
		expect(quickMove.getByRole('button', { name: 'Move motor-1 QuickMove' })).toBeVisible()
	})

	it.each([
		['motor-1::setPower', 'SetPower'],
		['motor-1::setRpm', 'SetRPM'],
		['motor-1::isMoving', 'IsMoving'],
	])("gives the %s header its method's docs link and an error indicator", (paneId, method) => {
		renderSubject()

		const header = paneHeader(paneId)
		expect(header.getByRole('link', { name: `${method} docs` })).toBeVisible()
		expect(header.getByRole('button', { name: `${method}: No errors` })).toBeInTheDocument()
	})

	it('titles an unstacked api pane with a breadcrumb heading', () => {
		renderSubject()

		expect(flatText(paneHeader('motor-1::setPower').getByRole('heading'))).toBe('motor-1 SetPower')
	})

	it('shows a stacked pane picked from the tree and focuses its move trigger', async () => {
		const user = userEvent.setup()
		renderSubject()

		await user.click(screen.getAllByRole('treeitem', { name: 'GoFor' })[0])

		const goFor = paneHeader('motor-1::goFor')
		await waitFor(() => {
			expect(goFor.getByRole('button', { name: 'Move motor-1 GoFor' })).toHaveFocus()
		})
		expect(screen.getByRole('tab', { name: /GoFor/u })).toHaveAttribute('aria-selected', 'true')
	})

	it('adds a pane for a pick that is not in the layout yet', async () => {
		const user = userEvent.setup()
		renderSubject()
		expect(document.querySelector('[data-pane-id="motor-2::quickMove"]')).toBeNull()

		await user.click(screen.getAllByRole('treeitem', { name: 'QuickMove' })[1])

		await waitFor(() => {
			expect(
				paneHeader('motor-2::quickMove').getByRole('button', { name: 'Move motor-2 QuickMove' })
			).toHaveFocus()
		})
	})

	it('lists a branch for each resource that has widgets and none for one that has not', () => {
		renderSubject()

		const tree = within(screen.getByRole('tree', { name: 'Resources' }))
		for (const name of ['motor-1', 'motor-2', 'arm-1']) {
			expect(tree.getByRole('button', { name: new RegExp(name, 'u') })).toBeInTheDocument()
		}
		expect(tree.queryByText('base-1')).not.toBeInTheDocument()
	})

	it('titles a picked arm control with the resource alone and an arm api with its method', async () => {
		const user = userEvent.setup()
		renderSubject()
		const tree = within(screen.getByRole('tree', { name: 'Resources' }))

		await user.click(tree.getByRole('treeitem', { name: 'Jog' }))
		await user.click(tree.getByRole('treeitem', { name: 'GetEndPosition' }))

		const control = await waitFor(() => paneHeader('arm-1::jog'))
		expect(flatText(control.getByRole('heading'))).toBe('arm-1')
		expect(flatText(paneHeader('arm-1::getEndPosition').getByRole('heading'))).toBe(
			'arm-1 GetEndPosition'
		)
	})
})
