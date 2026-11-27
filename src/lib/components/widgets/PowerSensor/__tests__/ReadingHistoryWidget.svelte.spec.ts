import { render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { flushSync } from 'svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../ReadingHistoryWidget.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'
import { powerFeed, publishReading, resetFeed } from './__fixtures__/power-feed.svelte'

const state = vi.hoisted(() => ({ refetchPublishes: 0 }))

vi.mock('@viamrobotics/sdk', async (importOriginal) => ({
	...(await importOriginal<typeof import('@viamrobotics/sdk')>()),
	PowerSensorClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	const feed = await import('./__fixtures__/power-feed.svelte')
	const readData = (method: string) => {
		if (method === 'getVoltage') return [feed.powerFeed.voltage, false]
		if (method === 'getCurrent') return [feed.powerFeed.current, false]
		return feed.powerFeed.power
	}
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceQuery: vi.fn((_client: unknown, method: string) => ({
			get data() {
				return readData(method)
			},
			get dataUpdatedAt() {
				return feed.powerFeed.updatedAt
			},
			get error() {
				return feed.powerFeed.error
			},
			isLoading: false,
			isSuccess: true,
			isError: false,
			fetchStatus: 'idle',
			refetch: vi.fn(() => {
				state.refetchPublishes += 1
				feed.publishReading(feed.powerFeed.voltage + 1)
				return Promise.resolve()
			}),
			queryKey: [],
		})),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

const lines = () => screen.getAllByTestId('history-line-polyline')

const pointsOf = (line: Element | undefined) =>
	(line?.getAttribute('points') ?? '').split(' ').filter(Boolean)

const publish = (voltage: number) => {
	publishReading(voltage)
	flushSync()
}

describe('PowerSensor ReadingHistory widget', () => {
	beforeEach(() => {
		state.refetchPublishes = 0
		localStorage.clear()
		resetFeed(1000)
	})

	it('renders Voltage, Current, then Power readouts with units, each with a history line', () => {
		render(PaneSubject, { props: { widget: Subject } })

		const groups = screen
			.getAllByRole('group')
			.map((group) => group.textContent.replaceAll(/\s+/g, ' ').trim())
			.filter((text) => /^\d/.test(text))
		expect(groups).toHaveLength(3)
		expect(groups[0]).toMatch(/V DC$/)
		expect(groups[1]).toMatch(/A DC$/)
		expect(groups[2]).toMatch(/W$/)
		expect(lines()).toHaveLength(3)
	})

	it('keeps 72 samples and drops the oldest on the 73rd update', () => {
		render(PaneSubject, { props: { widget: Subject } })
		for (let voltage = 1; voltage <= 71; voltage += 1) publish(voltage)

		const [voltageLine] = lines()
		expect(pointsOf(voltageLine)).toHaveLength(72)
		expect((pointsOf(voltageLine)[0] ?? '').split(',')[1]).toBe('1')

		publish(72)

		expect(pointsOf(voltageLine)).toHaveLength(72)
		expect((pointsOf(voltageLine)[0] ?? '').split(',')[1]).not.toBe('1')
	})

	it('clears every history when the refresh rate changes', async () => {
		render(PaneSubject, { props: { widget: Subject } })
		publish(5)
		expect(pointsOf(lines()[0])).toHaveLength(2)

		await userEvent.click(screen.getByRole('combobox'))
		await userEvent.click(await screen.findByRole('option', { name: 'every 5 seconds' }))

		await waitFor(() => {
			for (const line of lines()) expect(pointsOf(line)).toHaveLength(0)
		})
	})

	it('keeps the history across Pause and Resume', async () => {
		render(PaneSubject, { props: { widget: Subject } })
		publish(5)
		expect(pointsOf(lines()[0])).toHaveLength(2)

		await userEvent.click(screen.getByRole('button', { name: 'Pause' }))
		await screen.findByRole('button', { name: 'Resume' })
		await userEvent.click(screen.getByRole('button', { name: 'Resume' }))
		await screen.findByRole('button', { name: 'Pause' })

		for (const line of lines()) expect(pointsOf(line)).toHaveLength(2)
	})

	it('clears the history for another resource', async () => {
		const { rerender } = render(Subject, {
			props: { partID: 'test-part', resourceName: 'test-power-sensor' },
		})
		publish(5)
		expect(pointsOf(lines()[0])).toHaveLength(2)

		await rerender({ partID: 'test-part', resourceName: 'other-power-sensor' })

		await waitFor(() => {
			for (const line of lines()) expect(pointsOf(line)).toHaveLength(0)
		})
	})

	it('takes one sample of all three on a manual refresh', async () => {
		render(PaneSubject, { props: { widget: Subject } })
		const before = pointsOf(lines()[0]).length
		await userEvent.click(screen.getByRole('button', { name: 'Pause' }))
		await waitFor(() => {
			expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
		})

		await userEvent.click(screen.getByRole('button', { name: 'Refresh' }))

		await waitFor(() => {
			for (const line of lines()) expect(pointsOf(line)).toHaveLength(before + 1)
		})
	})

	describe('history span note', () => {
		const storageKey =
			'control-card-refresh/test-part/test-power-sensor/power-sensor-reading-history'

		it.each([
			{ rate: 'HALF_SEC', interval: 500, text: 'Last 36 s' },
			{ rate: 'ONE_SEC', interval: 1000, text: 'Last 72 s' },
			{ rate: 'FIVE_SEC', interval: 5000, text: 'Last 6 min' },
			{ rate: 'MANUAL', interval: false, text: 'Last 72 samples' },
		])('reads "$text" at the $rate refresh rate', ({ interval, text }) => {
			localStorage.setItem(storageKey, JSON.stringify(interval))

			render(PaneSubject, { props: { widget: Subject } })

			expect(screen.getByText(/^Last /).textContent).toBe(text)
		})

		it('changes the note when the refresh rate changes', async () => {
			render(PaneSubject, { props: { widget: Subject } })
			expect(screen.getByText(/^Last /).textContent).toBe('Last 72 s')

			await userEvent.click(screen.getByRole('button', { name: 'Pause' }))

			await waitFor(() => {
				expect(screen.getByText(/^Last /).textContent).toBe('Last 72 samples')
			})
		})
	})

	it('reports a failed read to the header indicator and adds no sample', async () => {
		render(PaneSubject, { props: { widget: Subject } })
		publish(5)
		const before = pointsOf(lines()[0]).length

		powerFeed.error = new Error('read failed')
		flushSync()

		await waitFor(() => {
			expect(screen.getByRole('button', { name: /1 error/ })).toBeInTheDocument()
		})
		expect(pointsOf(lines()[0])).toHaveLength(before)
		expect(screen.getAllByRole('group').some((group) => group.textContent.includes('5.0000'))).toBe(
			true
		)
	})
})
