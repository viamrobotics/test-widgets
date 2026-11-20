import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../board.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const boardCalls = vi.hoisted(() => ({ mutate: vi.fn(), mutateAsync: vi.fn() }))

vi.mock('@viamrobotics/sdk', async (importOriginal) => ({
	...(await importOriginal<typeof import('@viamrobotics/sdk')>()),
	BoardClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceMutation: vi.fn((_client: unknown, method: string) => ({
			mutate: (args: unknown[]) => boardCalls.mutate(method, args),
			mutateAsync: (args: unknown[]) => boardCalls.mutateAsync(method, args),
			isPending: false,
			error: null,
		})),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

const PANE_WIDTH = '320px'
const MISSING_PIN_HINT = 'Enter a pin in the Pin field above.'
const MUTATORS = ['SetGPIO', 'SetPWM', 'SetPWMFrequency', 'WriteAnalog', 'SetPowerMode']
const QUERIES = [
	'GetGPIO',
	'PWM',
	'PWMFrequency',
	'ReadAnalogReader',
	'GetDigitalInterruptValue',
	'StreamTicks',
]

const renderInPane = () => {
	render(PaneSubject, { props: { widget: Subject } })
	const pane = screen.getByTestId('pane')
	const root = pane.firstElementChild
	if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')
	return { pane, root }
}

const headingNames = (layer: string) =>
	within(screen.getByRole('group', { name: layer }))
		.getAllByRole('heading')
		.map((heading) => heading.textContent?.trim())

const firstButton = (layer: string, name: string) => {
	const button = within(screen.getByRole('group', { name: layer }))
		.getAllByRole('button', { name })
		.at(0)
	if (!button) throw new Error(`No ${name} button in ${layer}`)
	return button
}

describe('BoardWidget', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		boardCalls.mutate.mockClear()
		boardCalls.mutateAsync.mockClear()
		user = userEvent.setup()
	})

	it('draws one shared Pin field with its hint', () => {
		renderInPane()

		expect(screen.getAllByRole('textbox', { name: 'Pin' })).toHaveLength(1)
		expect(screen.getByRole('textbox', { name: 'Pin' })).toHaveAccessibleDescription(
			'Used by the seven pin widgets. Analog reader and interrupt widgets keep their own.'
		)
	})

	it('lists the five mutators in order', () => {
		renderInPane()

		expect(headingNames('Mutators')).toEqual(MUTATORS)
	})

	it('lists the six queries in order', () => {
		renderInPane()

		expect(headingNames('Queries')).toEqual(QUERIES)
	})

	it('puts the mutators above the queries', () => {
		renderInPane()

		const mutators = screen.getByRole('group', { name: 'Mutators' }).getBoundingClientRect()
		const queries = screen.getByRole('group', { name: 'Queries' }).getBoundingClientRect()
		expect(mutators.bottom).toBeLessThanOrEqual(queries.top)
	})

	it('sends the shared pin with SetGPIO', async () => {
		renderInPane()
		await user.type(screen.getByRole('textbox', { name: 'Pin' }), '7')

		await user.click(firstButton('Mutators', 'Execute'))

		expect(boardCalls.mutate).toHaveBeenCalledWith('setGPIO', ['7', true])
	})

	it('sends the shared pin with GetGPIO', async () => {
		renderInPane()
		await user.type(screen.getByRole('textbox', { name: 'Pin' }), '7')

		await user.click(firstButton('Queries', 'Get'))

		expect(boardCalls.mutateAsync).toHaveBeenCalledWith('getGPIO', ['7'])
	})

	it('shows the missing pin hint in the seven pin widgets while the field is empty', () => {
		renderInPane()

		expect(screen.getAllByText(MISSING_PIN_HINT)).toHaveLength(7)
	})

	it('disables the SetGPIO Execute button while the field is empty', () => {
		renderInPane()

		expect(firstButton('Mutators', 'Execute')).toBeDisabled()
	})

	it('drops the hints once a pin is entered', async () => {
		renderInPane()

		await user.type(screen.getByRole('textbox', { name: 'Pin' }), '7')

		expect(screen.queryByText(MISSING_PIN_HINT)).toBeNull()
	})
})

describe('BoardWidget in a 320 px pane', () => {
	it('loads the app stylesheet, so the pane takes its utility width', () => {
		const { pane } = renderInPane()

		expect(getComputedStyle(pane).width).toBe(PANE_WIDTH)
	})

	it('does not scroll horizontally', () => {
		const { pane, root } = renderInPane()

		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})

	it('stacks the layers in one column', () => {
		renderInPane()

		const [first, second] = within(screen.getByRole('group', { name: 'Mutators' })).getAllByRole(
			'heading'
		)
		expect(second?.getBoundingClientRect().top).toBeGreaterThan(
			first?.getBoundingClientRect().bottom ?? Infinity
		)
	})
})

const SECOND_COLUMN_PANE_PX = 672
const THIRD_COLUMN_PANE_PX = 896

const cellsOf = (layer: string) => [...screen.getByRole('group', { name: layer }).children]

const displayOf = (cell: Element | undefined) => {
	if (!cell) throw new Error('The layer has no such cell')
	return getComputedStyle(cell).display
}

const rightBorder = (cell: Element | undefined) => {
	if (!cell) throw new Error('The layer has no such cell')
	return getComputedStyle(cell).borderRightWidth
}

describe('BoardWidget layer dividers', () => {
	it('draws no right border on the last cell of a row at two columns', () => {
		const { pane } = renderInPane()

		pane.style.width = `${SECOND_COLUMN_PANE_PX}px`

		const cells = cellsOf('Queries')
		expect(rightBorder(cells[0]), 'first cell').toBe('1px')
		expect(rightBorder(cells[1]), 'last cell').toBe('0px')
	})

	it('fills the short mutator row with a hidden filler cell at two columns', () => {
		const { pane } = renderInPane()

		pane.style.width = `${SECOND_COLUMN_PANE_PX}px`

		const cells = cellsOf('Mutators')
		expect(cells).toHaveLength(6)
		expect(cells[5]).toHaveAttribute('aria-hidden', 'true')
		expect(displayOf(cells[5])).toBe('block')
		expect(rightBorder(cells[5]), 'filler').toBe('0px')
	})

	it('draws the dividers inside columns two only at three columns', () => {
		const { pane } = renderInPane()

		pane.style.width = `${THIRD_COLUMN_PANE_PX}px`

		const cells = cellsOf('Queries')
		expect(rightBorder(cells[0]), 'first cell').toBe('1px')
		expect(rightBorder(cells[1]), 'middle cell').toBe('1px')
		expect(rightBorder(cells[2]), 'last cell').toBe('0px')
	})

	it('hides the filler cell in one column', () => {
		renderInPane()

		expect(displayOf(cellsOf('Mutators')[5])).toBe('none')
	})
})

describe('BoardWidget cells', () => {
	it.each(['Mutators', 'Queries'])(
		'fills each %s cell with its section at two columns',
		(layer) => {
			const { pane } = renderInPane()

			pane.style.width = `${SECOND_COLUMN_PANE_PX}px`

			const cells = cellsOf(layer).filter((cell) => cell.getAttribute('aria-hidden') !== 'true')
			expect(cells.length).toBeGreaterThan(0)
			for (const cell of cells) {
				const section = cell.firstElementChild
				if (!section) throw new Error('A cell has no section')
				expect(section.getBoundingClientRect().height, section.textContent ?? '').toBeCloseTo(
					cell.clientHeight,
					0
				)
			}
		}
	)
})
