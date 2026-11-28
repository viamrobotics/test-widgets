import { fireEvent, render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import InWidgetsProvider from '#lib/__tests__/__fixtures__/InWidgetsProvider.svelte'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../SetPowerModeWidget.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'

const state = vi.hoisted((): { mutateAsync: Mock; error: Error | null } => ({
	mutateAsync: vi.fn(),
	error: null,
}))

vi.mock('@viamrobotics/sdk', () => ({
	BoardClient: class {},
	PowerMode: { UNSPECIFIED: 0, NORMAL: 1, OFFLINE_DEEP: 2 },
	Duration: class {
		seconds: bigint
		nanos: number
		constructor({ seconds, nanos }: { seconds: bigint; nanos: number }) {
			this.seconds = seconds
			this.nanos = nanos
		}
	},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({
		mutateAsync: state.mutateAsync,
		isPending: false,
		get error() {
			return state.error
		},
	})),
}))

const UNSPECIFIED = 0
const NORMAL = 1
const OFFLINE_DEEP = 2
const DURATION_MESSAGE = 'Enter a duration of 0 seconds or more.'
const WARNING = 'The board may stop answering until it wakes.'

const renderSubject = () =>
	render(InWidgetsProvider, {
		props: { component: Subject, props: { partID: 'test-part', resourceName: 'test-board' } },
	})

const chooseMode = async (name: string) => {
	await userEvent.click(screen.getByRole('combobox', { name: 'Power mode' }))
	await userEvent.click(await screen.findByRole('option', { name }))
}

const chooseOfflineDeep = () => chooseMode('Offline deep')

describe('Board SetPowerMode widget', () => {
	beforeEach(() => {
		state.mutateAsync = vi.fn()
		state.error = null
	})

	it('renders the SetPowerMode section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'SetPowerMode' })).toBeInTheDocument()
	})

	it('sends Unspecified when it is chosen', async () => {
		renderSubject()

		await chooseMode('Unspecified')
		await userEvent.click(screen.getByRole('button', { name: /execute/iu }))

		expect(state.mutateAsync).toHaveBeenCalledWith([UNSPECIFIED])
	})

	it('sends Normal with a duration', async () => {
		renderSubject()

		await userEvent.type(screen.getByRole('spinbutton', { name: /duration/iu }), '30')
		await userEvent.click(screen.getByRole('button', { name: /execute/iu }))

		const [mode, duration] = state.mutateAsync.mock.calls[0]?.[0] ?? []
		expect(mode).toBe(NORMAL)
		expect(duration).toMatchObject({ seconds: 30n, nanos: 0 })
	})

	it('sends a fraction of a second as nanos', async () => {
		renderSubject()

		await userEvent.type(screen.getByRole('spinbutton', { name: /duration/iu }), '1.5')
		await userEvent.click(screen.getByRole('button', { name: /execute/iu }))

		const [, duration] = state.mutateAsync.mock.calls[0]?.[0] ?? []
		expect(duration).toMatchObject({ seconds: 1n, nanos: 500_000_000 })
	})

	it('carries a duration that rounds up to the next second into seconds, not nanos', async () => {
		renderSubject()

		await userEvent.type(screen.getByRole('spinbutton', { name: /duration/iu }), '1.9999999996')
		await userEvent.click(screen.getByRole('button', { name: /execute/iu }))

		const [, duration] = state.mutateAsync.mock.calls[0]?.[0] ?? []
		expect(duration).toMatchObject({ seconds: 2n, nanos: 0 })
	})

	it('shows the reason in a tooltip when a held-back Execute takes focus', async () => {
		renderSubject()
		await userEvent.type(screen.getByRole('spinbutton', { name: /duration/iu }), '-5')

		await fireEvent.focusIn(screen.getByRole('button', { name: /execute/iu }))

		expect(await screen.findByRole('tooltip')).toHaveTextContent(DURATION_MESSAGE)
	})

	it('sends Normal with no duration and shows no warning', async () => {
		renderSubject()

		expect(screen.queryByText(WARNING)).not.toBeInTheDocument()
		await userEvent.click(screen.getByRole('button', { name: /execute/iu }))

		expect(state.mutateAsync).toHaveBeenCalledWith([NORMAL])
	})

	it('shows the warning and Duration for Offline deep, and sends no duration when empty', async () => {
		renderSubject()

		await chooseOfflineDeep()
		expect(screen.getByText(WARNING)).toBeInTheDocument()
		await userEvent.click(screen.getByRole('button', { name: /execute/iu }))

		expect(state.mutateAsync).toHaveBeenCalledWith([OFFLINE_DEEP])
	})

	it('sends Offline deep with the duration in seconds', async () => {
		renderSubject()

		await chooseOfflineDeep()
		await userEvent.type(screen.getByRole('spinbutton', { name: /duration/iu }), '30')
		await userEvent.click(screen.getByRole('button', { name: /execute/iu }))

		expect(state.mutateAsync).toHaveBeenCalledTimes(1)
		const [mode, duration] = state.mutateAsync.mock.calls[0]?.[0] ?? []
		expect(mode).toBe(OFFLINE_DEEP)
		expect(duration).toMatchObject({ seconds: 30n })
	})

	it('holds back Execute for a negative duration', async () => {
		renderSubject()

		await chooseOfflineDeep()
		await userEvent.type(screen.getByRole('spinbutton', { name: /duration/iu }), '-5')
		await fireEvent.click(screen.getByRole('button', { name: /execute/iu }))

		expect(screen.getByRole('button', { name: /execute/iu })).toBeDisabled()
		expect(state.mutateAsync).not.toHaveBeenCalled()
	})

	it('names the duration message from the field and Execute', async () => {
		renderSubject()

		await chooseOfflineDeep()
		const field = screen.getByRole('spinbutton', { name: /duration/iu })
		expect(screen.queryByText(DURATION_MESSAGE)).not.toBeInTheDocument()
		await userEvent.type(field, '-5')

		expect(screen.getByText(DURATION_MESSAGE)).toBeVisible()
		expect(field).toHaveAccessibleDescription(expect.stringContaining(DURATION_MESSAGE))
		expect(screen.getByRole('button', { name: /execute/iu })).toHaveAccessibleDescription(
			DURATION_MESSAGE
		)
	})

	it("shows the mutation error in the section's error indicator", () => {
		state.error = new Error('board refused to sleep')

		renderSubject()

		expect(
			screen.getByRole('button', { name: 'SetPowerMode: 1 error, copy to clipboard' })
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

describe('Board SetPowerMode widget in a 320 px pane', () => {
	it('loads the app stylesheet, so the pane takes its utility width', () => {
		const { pane } = renderInPane()

		expect(getComputedStyle(pane).width).toBe(PANE_WIDTH)
	})

	it('does not scroll horizontally', () => {
		const { pane, root } = renderInPane()

		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
