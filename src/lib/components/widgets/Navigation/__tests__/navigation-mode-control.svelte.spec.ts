import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import InWidgetsProvider from '$lib/__tests__/__fixtures__/in-widgets-provider.svelte'

import Subject from '../navigation-mode-control.svelte'
import SetModeWidget from '../set-mode-widget.svelte'

const MODE_MANUAL = 1
const MODE_WAYPOINT = 2

const state = vi.hoisted((): { mode: number | undefined; setMode: ReturnType<typeof vi.fn> } => ({
	mode: undefined,
	setMode: vi.fn(),
}))

vi.mock('@viamrobotics/sdk', () => ({
	NavigationClient: class {},
	navigationApi: { Mode: { UNSPECIFIED: 0, MANUAL: 1, WAYPOINT: 2, EXPLORE: 3 } },
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		get data() {
			return state.mode
		},
		isLoading: false,
		isSuccess: true,
		error: null,
		fetchStatus: 'idle',
		refetch: () => Promise.resolve({ error: null, data: state.mode }),
	})),
	createResourceMutation: vi.fn(() => ({
		mutateAsync: state.setMode,
		isPending: false,
		error: null,
	})),
}))

const PROPS = { partID: 'test-part', resourceName: 'test-nav' }

const renderSubject = () =>
	render(InWidgetsProvider, { props: { component: Subject, props: PROPS } })

const holdSetMode = () => {
	let finish: () => void = () => {}
	state.setMode.mockReturnValue(
		new Promise<void>((resolve) => {
			finish = resolve
		})
	)
	return () => {
		finish()
	}
}

describe('Navigation Mode control', () => {
	beforeEach(() => {
		state.mode = undefined
		state.setMode.mockReset()
		state.setMode.mockResolvedValue(undefined)
	})

	it('heads the section Mode', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Mode' })).toBeInTheDocument()
	})

	it('offers Manual and Waypoint as the only modes', () => {
		renderSubject()

		const labels = screen.getAllByRole('radio').map((radio) => radio.textContent.trim())

		expect(labels).toEqual(['Manual', 'Waypoint'])
	})

	it("checks the service's current mode", () => {
		state.mode = MODE_WAYPOINT

		renderSubject()

		expect(screen.getByRole('radio', { name: 'Waypoint' })).toBeChecked()
	})

	it.each([
		{ label: 'Manual', mode: MODE_MANUAL },
		{ label: 'Waypoint', mode: MODE_WAYPOINT },
	])('sets the mode to $mode when $label is pressed', async ({ label, mode }) => {
		renderSubject()

		await userEvent.click(screen.getByRole('radio', { name: label }))

		expect(state.setMode).toHaveBeenCalledWith([mode])
	})

	it('disables Mode while SetMode is pending and drops a press made meanwhile', async () => {
		const finish = holdSetMode()
		renderSubject()

		await userEvent.click(screen.getByRole('radio', { name: 'Waypoint' }))

		await vi.waitFor(() => {
			expect(screen.getByRole('radio', { name: 'Manual' })).toBeDisabled()
		})
		expect(screen.getByRole('radio', { name: 'Waypoint' }).closest('[aria-busy]')).toHaveAttribute(
			'aria-busy',
			'true'
		)
		await userEvent.click(screen.getByRole('radio', { name: 'Manual' }))
		expect(state.setMode).toHaveBeenCalledTimes(1)

		finish()
		await vi.waitFor(() => {
			expect(screen.getByRole('radio', { name: 'Manual' })).toBeEnabled()
		})
	})

	it("disables SetMode's Execute while its own press is pending, as one mode group", async () => {
		const finish = holdSetMode()
		render(InWidgetsProvider, { props: { component: [Subject, SetModeWidget], props: PROPS } })

		await userEvent.click(screen.getAllByRole('radio', { name: 'Manual' })[0])

		await vi.waitFor(() => {
			expect(screen.getByRole('button', { name: 'Execute' })).toBeDisabled()
		})

		finish()
		await vi.waitFor(() => {
			expect(screen.getAllByRole('radio', { name: 'Manual' })[0]).toBeEnabled()
		})
	})
})
