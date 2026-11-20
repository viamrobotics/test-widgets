import { render, screen, waitFor, within } from '@testing-library/svelte'
import { userEvent } from '@testing-library/user-event'
import { robotApi } from '@viamrobotics/sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../pane-playground.svelte'

const state = vi.hoisted((): { mutationErrors: Record<string, Error> } => ({
	mutationErrors: {},
}))

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
	createResourceClient: () => ({ current: {} }),
	createResourceQuery: () => ({
		data: undefined,
		error: null,
		fetchStatus: 'idle',
		isLoading: false,
		isSuccess: true,
	}),
	createResourceMutation: (_client: unknown, method: string) => ({
		mutate: () => {},
		isPending: false,
		get error() {
			return state.mutationErrors[method] ?? null
		},
	}),
}))

const paneHeader = (paneId: string) => {
	const header = document.querySelector(`[data-pane-id="${paneId}"] [data-pane-header]`)
	if (!(header instanceof HTMLElement)) throw new Error(`No header for pane ${paneId}`)
	return within(header)
}

const renderSubject = () => render(Subject, { partID: 'part-1' })

describe('Pane playground', () => {
	beforeEach(() => {
		state.mutationErrors = {}
	})

	it("lays the first motor's widgets out as a split, a stack, and a float", () => {
		renderSubject()

		expect(screen.getAllByRole('separator', { name: 'Resize panes' })).toHaveLength(2)
		expect(paneHeader('motor-1::composite').getByRole('heading', { name: 'motor-1' })).toBeVisible()

		const tabs = within(screen.getByRole('tablist', { name: 'Stacked panes' })).getAllByRole('tab')
		expect(tabs.map((tab) => tab.textContent?.replaceAll(/\s+/gu, ' ').trim())).toEqual([
			'motor-1 SetRPM',
			'motor-1 GoFor',
			'motor-1 GoTo',
		])

		const isMoving = paneHeader('motor-1::is-moving')
		expect(isMoving.getByRole('button', { name: 'Dock motor-1 IsMoving' })).toBeVisible()
		expect(isMoving.getByRole('button', { name: 'Close motor-1 IsMoving' })).toBeVisible()
	})

	it('titles the composite with the resource alone and keeps the indicator out of its header', () => {
		renderSubject()

		const composite = paneHeader('motor-1::composite')
		expect(composite.queryByRole('link', { name: /docs/u })).not.toBeInTheDocument()
		expect(composite.queryByRole('button', { name: /error/u })).not.toBeInTheDocument()
		expect(composite.getByRole('button', { name: 'Move motor-1' })).toBeVisible()
	})

	it.each([
		['motor-1::set-power', 'SetPower'],
		['motor-1::set-rpm', 'SetRPM'],
		['motor-1::is-moving', 'IsMoving'],
	])("gives the %s header its method's docs link and an error indicator", (paneId, method) => {
		renderSubject()

		const header = paneHeader(paneId)
		expect(header.getByRole('link', { name: `${method} docs` })).toHaveAttribute(
			'href',
			`https://docs.viam.com/reference/apis/components/motor/#${method.toLowerCase()}`
		)
		expect(header.getByRole('button', { name: `${method}: No errors` })).toBeInTheDocument()
	})

	it.each([
		['motor-1::set-power', 'motor-1 SetPower'],
		['motor-1::is-moving', 'motor-1 IsMoving'],
	])('titles the unstacked %s pane with a breadcrumb heading', (paneId, title) => {
		renderSubject()

		const heading = paneHeader(paneId).getByRole('heading')
		expect(heading.textContent?.replaceAll(/\s+/gu, ' ').trim()).toBe(title)
	})

	it("names the stack's shown method on its selected tab", () => {
		renderSubject()

		const header = paneHeader('motor-1::set-rpm')
		expect(
			header.getByRole('tab', { selected: true }).textContent?.replaceAll(/\s+/gu, ' ').trim()
		).toBe('motor-1 SetRPM')
	})

	it("raises a mutation error from a pane's body on that pane's header indicator only", () => {
		state.mutationErrors = { setRPM: new Error('motor is not powered') }

		renderSubject()

		expect(
			paneHeader('motor-1::set-rpm').getByRole('button', {
				name: 'SetRPM: 1 error, copy to clipboard',
			})
		).toBeInTheDocument()
		expect(
			paneHeader('motor-1::set-power').getByRole('button', { name: 'SetPower: No errors' })
		).toBeInTheDocument()
	})

	it('shows a stacked pane picked from the tree and focuses its move trigger', async () => {
		const user = userEvent.setup()
		renderSubject()

		await user.click(screen.getAllByRole('treeitem', { name: 'GoFor' })[0])

		const goFor = paneHeader('motor-1::go-for')
		await waitFor(() => {
			expect(goFor.getByRole('button', { name: 'Move motor-1 GoFor' })).toHaveFocus()
		})
		expect(screen.getByRole('tab', { name: /GoFor/u })).toHaveAttribute('aria-selected', 'true')
	})

	it('adds a pane for a pick that is not in the layout yet', async () => {
		const user = userEvent.setup()
		renderSubject()
		expect(document.querySelector('[data-pane-id="motor-2::composite"]')).toBeNull()

		await user.click(screen.getByRole('button', { name: /motor-2/u }))

		await waitFor(() => {
			expect(
				paneHeader('motor-2::composite').getByRole('button', { name: 'Move motor-2' })
			).toHaveFocus()
		})
	})

	it("lists the machine's arms and motion services beside its motors", () => {
		renderSubject()

		const tree = within(screen.getByRole('tree', { name: 'Resources' }))
		for (const name of ['motor-1', 'motor-2', 'arm-1']) {
			expect(tree.getByRole('button', { name: new RegExp(name, 'u') })).toBeInTheDocument()
		}
		// Motion has a composite and no entries, so its row is a leaf.
		expect(tree.getByRole('treeitem', { name: 'motion-1' })).toBeInTheDocument()
	})

	it("lists the machine's bases, gantries, and servos beside the other resources", () => {
		renderSubject()

		const tree = within(screen.getByRole('tree', { name: 'Resources' }))
		for (const name of ['base-1', 'gantry-1', 'servo-1']) {
			expect(tree.getByRole('button', { name: new RegExp(name, 'u') })).toBeInTheDocument()
		}
	})

	it("lists the machine's grippers, boards, switches, and buttons", () => {
		renderSubject()

		const tree = within(screen.getByRole('tree', { name: 'Resources' }))
		expect(tree.getByRole('button', { name: /gripper-1/u })).toBeInTheDocument()
		for (const name of ['board-1', 'switch-1', 'button-1']) {
			expect(tree.getByRole('treeitem', { name })).toBeInTheDocument()
		}
	})

	it("lists the machine's sensors, power sensors, encoders, and input controllers", () => {
		renderSubject()

		const tree = within(screen.getByRole('tree', { name: 'Resources' }))
		for (const name of ['movement-sensor-1', 'power-sensor-1', 'encoder-1']) {
			expect(tree.getByRole('button', { name: new RegExp(name, 'u') })).toBeInTheDocument()
		}
		for (const name of ['sensor-1', 'input-controller-1']) {
			expect(tree.getByRole('treeitem', { name })).toBeInTheDocument()
		}
	})

	it("lists the machine's audio inputs, audio outputs, discovery services, and ML model services", () => {
		renderSubject()

		const tree = within(screen.getByRole('tree', { name: 'Resources' }))
		for (const name of ['audio-input-1', 'audio-output-1', 'discovery-1', 'ml-model-1']) {
			expect(tree.getByRole('button', { name: new RegExp(name, 'u') })).toBeInTheDocument()
		}
	})

	it('titles a picked arm control with the resource alone and an arm api with its method', async () => {
		const user = userEvent.setup()
		renderSubject()
		const tree = within(screen.getByRole('tree', { name: 'Resources' }))

		await user.click(tree.getByRole('treeitem', { name: 'Manual mode' }))
		await user.click(tree.getAllByRole('treeitem', { name: 'Stop' }).at(0) ?? document.body)

		const control = await waitFor(() => paneHeader('arm-1::manual-mode'))
		expect(control.getByRole('heading').textContent?.replaceAll(/\s+/gu, ' ').trim()).toBe('arm-1')
		const api = paneHeader('arm-1::stop')
		expect(api.getByRole('heading').textContent?.replaceAll(/\s+/gu, ' ').trim()).toBe('arm-1 Stop')
	})
})
