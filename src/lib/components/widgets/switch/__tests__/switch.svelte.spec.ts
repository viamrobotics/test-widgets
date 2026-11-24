import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../switch.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const state = vi.hoisted(
	(): {
		mutate: Mock
		refetch: Mock
		position: number
		positions: [number, string[]]
		mutationError: Error | null
		queryError: Error | null
	} => ({
		mutate: vi.fn(),
		refetch: vi.fn(),
		position: 1,
		positions: [3, ['Off', 'On', 'Auto']],
		mutationError: null,
		queryError: null,
	})
)

vi.mock('@viamrobotics/sdk', async (importOriginal) => ({
	...(await importOriginal<typeof import('@viamrobotics/sdk')>()),
	SwitchClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceQuery: vi.fn((_client: unknown, method: string) => ({
			data: method === 'getPosition' ? state.position : state.positions,
			isLoading: false,
			isSuccess: true,
			isError: false,
			fetchStatus: 'idle',
			get error() {
				return method === 'getPosition' ? state.queryError : null
			},
			refetch: state.refetch,
			queryKey: [],
		})),
		createResourceMutation: vi.fn(() => ({
			mutate: state.mutate,
			isPending: false,
			get error() {
				return state.mutationError
			},
		})),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

const settleOnSuccess = (_args: unknown, options?: { onSettled?: () => void }) => {
	options?.onSettled?.()
}

const nextFrame = () =>
	new Promise<void>((resolve) => {
		requestAnimationFrame(() => {
			resolve()
		})
	})

const settleLayout = async () => {
	await document.fonts.ready
	await nextFrame()
	await nextFrame()
}

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-switch' },
	})

const renderAtWidth = (width: number) => {
	const target = document.createElement('div')
	target.style.width = `${width}px`
	document.body.append(target)
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-switch' }, target })
	return target
}

const headingTop = (target: HTMLElement, name: string) =>
	within(target).getByRole('heading', { name }).getBoundingClientRect().top

describe('Switch widget', () => {
	afterEach(() => {
		document.body.replaceChildren()
	})

	beforeEach(() => {
		state.mutate = vi.fn(settleOnSuccess)
		state.refetch = vi.fn()
		state.position = 1
		state.positions = [3, ['Off', 'On', 'Auto']]
		state.mutationError = null
		state.queryError = null
		vi.mocked(createResourceQuery).mockClear()
	})

	it('renders the SetPosition section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'SetPosition' })).toBeInTheDocument()
	})

	it('draws the three layers, each widget in its own', () => {
		renderSubject()

		const mutators = screen.getByRole('group', { name: 'Mutators' })
		const queries = screen.getByRole('group', { name: 'Queries' })
		expect(
			within(screen.getByRole('group', { name: 'At a glance' })).getByRole('group', {
				name: 'Position',
			})
		).toBeInTheDocument()
		expect(within(mutators).getByRole('heading', { name: 'SetPosition' })).toBeInTheDocument()
		expect(
			within(queries).getByRole('heading', { name: 'GetNumberOfPositions' })
		).toBeInTheDocument()
	})

	it('reads the position and its label in the glance row, without a GetPosition heading', () => {
		renderSubject()

		const glance = screen.getByRole('group', { name: 'At a glance' })
		expect(within(glance).getByRole('group', { name: 'Position' })).toHaveTextContent('On 1')
		expect(screen.queryByRole('heading', { name: 'GetPosition' })).not.toBeInTheDocument()
	})

	it('draws SetPosition beside GetNumberOfPositions from 672 px, and stacked under it', () => {
		const wide = renderAtWidth(700)
		expect(headingTop(wide, 'SetPosition')).toBe(headingTop(wide, 'GetNumberOfPositions'))
		document.body.replaceChildren()

		const narrow = renderAtWidth(320)
		expect(headingTop(narrow, 'SetPosition')).toBeLessThan(
			headingTop(narrow, 'GetNumberOfPositions')
		)
	})

	it('stops growing at 672 px', () => {
		const target = renderAtWidth(900)

		expect(
			target.querySelector('[data-testid="switch-composite"]')?.getBoundingClientRect().width
		).toBe(672)
	})

	it('polls the position every 500 ms and reads the count once', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getPosition', {
			refetchInterval: 500,
		})
		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getNumberOfPositions')
	})

	it('sets the position and refetches it when a position is picked', async () => {
		renderSubject()

		await userEvent.click(await screen.findByRole('radio', { name: 'Auto' }))

		expect(state.mutate).toHaveBeenCalledTimes(1)
		expect(state.mutate).toHaveBeenCalledWith([2], expect.anything())
		expect(state.refetch).toHaveBeenCalledTimes(1)
	})

	it("shows a failing query in the section's error indicator", () => {
		state.queryError = new Error('switch unreachable')

		renderSubject()

		expect(
			screen.getByRole('button', { name: 'SetPosition: 1 error, copy to clipboard' })
		).toBeInTheDocument()
	})

	it("shows the set position error in the section's error indicator", () => {
		state.mutationError = new Error('switch refused')

		renderSubject()

		expect(
			screen.getByRole('button', { name: 'SetPosition: 1 error, copy to clipboard' })
		).toBeInTheDocument()
	})
})

const PANE_WIDTH = '320px'

const renderInPane = () => {
	render(PaneSubject, { props: { widget: Subject } })
	const pane = screen.getByTestId('pane')
	const root = pane.firstElementChild
	if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')
	return { pane, root }
}

describe('Switch widget in a 320 px pane', () => {
	beforeEach(() => {
		state.mutate = vi.fn(settleOnSuccess)
		state.position = 1
		state.positions = [3, ['Off', 'On', 'Auto']]
		state.mutationError = null
		state.queryError = null
	})

	it('loads the app stylesheet, so the pane takes its utility width', () => {
		const { pane } = renderInPane()

		expect(getComputedStyle(pane).width).toBe(PANE_WIDTH)
	})

	it('draws 3 labeled positions as the toggle group', async () => {
		renderInPane()
		await settleLayout()

		expect(screen.getByRole('radiogroup', { name: 'Position' })).toBeInTheDocument()
		expect(screen.getAllByRole('radio')).toHaveLength(3)
		expect(screen.queryByRole('combobox', { name: 'Position' })).not.toBeInTheDocument()
	})

	it('draws 13 numbered positions as a Select', async () => {
		state.positions = [13, []]

		renderInPane()
		await settleLayout()

		expect(screen.getByRole('combobox', { name: 'Position' })).toBeInTheDocument()
		expect(screen.queryByRole('radio')).not.toBeInTheDocument()
	})

	it('does not scroll horizontally with 3 labeled positions', async () => {
		const { pane, root } = renderInPane()
		await settleLayout()

		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})

	it('does not scroll horizontally with 13 numbered positions', async () => {
		state.positions = [13, []]

		const { pane, root } = renderInPane()
		await settleLayout()

		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
