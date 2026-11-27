import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../StreamTicksWidget.svelte'
import PaneSubject from './__fixtures__/In320Pane.svelte'

interface Tick {
	pinName: string
	high: boolean
	time: number
}

interface StreamCall {
	interrupts: string[]
	queue: Tick[]
	signal: AbortSignal | undefined
	reject: (error: Error) => void
}

const stream = vi.hoisted(() => ({
	calls: [] as StreamCall[],
}))

vi.mock('@viamrobotics/sdk', () => ({
	BoardClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({
		current: {
			callOptions: {},
			streamTicks: (
				interrupts: string[],
				queue: Tick[],
				_extra: unknown,
				options?: { signal?: AbortSignal }
			) =>
				new Promise<void>((resolve, reject) => {
					const { signal } = options ?? {}
					stream.calls.push({ interrupts, queue, signal, reject })
					signal?.addEventListener('abort', () => resolve())
				}),
		},
	})),
}))

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-board' },
	})

const latestCall = () => {
	const call = stream.calls.at(-1)
	if (!call) throw new Error('No stream was opened')
	return call
}

const startStream = async (names: string) => {
	await userEvent.type(screen.getByRole('textbox', { name: 'Digital interrupts' }), names)
	await userEvent.click(screen.getByRole('button', { name: 'Start' }))
}

describe('Board StreamTicks widget', () => {
	beforeEach(() => {
		stream.calls = []
	})

	it('renders the StreamTicks section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'StreamTicks' })).toBeInTheDocument()
	})

	it('names the comma format as a hint on the field', () => {
		renderSubject()

		expect(screen.getByRole('textbox', { name: 'Digital interrupts' })).toHaveAccessibleDescription(
			'Separate names with commas'
		)
	})

	it('draws Start and Stop as compact buttons', () => {
		renderSubject()

		expect(screen.getByRole('button', { name: 'Start' })).toHaveClass('button', 'button-compact')
		expect(screen.getByRole('button', { name: 'Stop' })).toHaveClass('button', 'button-compact')
	})

	it('draws tick rows in the data font', async () => {
		renderSubject()
		await startStream('d1')

		latestCall().queue.push({ pinName: 'd1', high: true, time: 1_000_000_000 })

		const list = await screen.findByRole('list', { name: 'Last 20 ticks, newest first' })
		expect(list.querySelector('li')).toHaveClass('font-roboto-mono')
	})

	it('keeps Start disabled without names and Stop disabled while stopped', () => {
		renderSubject()

		expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled()
		expect(screen.getByRole('button', { name: 'Stop' })).toBeDisabled()
	})

	it('opens the stream for the comma-separated names and locks the field', async () => {
		renderSubject()

		await startStream('d1, d2')

		expect(latestCall().interrupts).toEqual(['d1', 'd2'])
		expect(screen.getByRole('textbox', { name: 'Digital interrupts' })).toBeDisabled()
		expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled()
		expect(screen.getByRole('button', { name: 'Stop' })).toBeEnabled()
	})

	it('lists streamed ticks newest first', async () => {
		renderSubject()
		await startStream('d1')

		const { queue } = latestCall()
		queue.push(
			{ pinName: 'd1', high: true, time: 1_000_000_000 },
			{ pinName: 'd2', high: false, time: 2_000_000_000 }
		)

		const list = await screen.findByRole('list', { name: 'Last 20 ticks, newest first' })
		const rows = list.querySelectorAll('li')
		expect(rows).toHaveLength(2)
		expect(rows[0]?.textContent).toContain('d2')
		expect(rows[0]?.textContent).toContain('Low')
		expect(rows[1]?.textContent).toContain('High')
	})

	it('keeps only the last 20 ticks', async () => {
		renderSubject()
		await startStream('d1')

		const { queue } = latestCall()
		for (let index = 0; index < 25; index += 1) {
			queue.push({ pinName: 'd1', high: true, time: index * 1_000_000 })
		}

		const list = await screen.findByRole('list', { name: 'Last 20 ticks, newest first' })
		await vi.waitFor(() => expect(list.querySelectorAll('li')).toHaveLength(20))
	})

	it('ends the stream on Stop and enables Start again', async () => {
		renderSubject()
		await startStream('d1')

		await userEvent.click(screen.getByRole('button', { name: 'Stop' }))

		expect(latestCall().signal?.aborted).toBe(true)
		expect(screen.getByRole('button', { name: 'Start' })).toBeEnabled()
		expect(screen.getByRole('button', { name: 'Stop' })).toBeDisabled()
	})

	it('announces the stream starting, stopping, and failing', async () => {
		renderSubject()
		const status = screen.getByTestId('status-line')
		expect(status).toHaveAttribute('aria-live', 'polite')
		expect(status).toHaveTextContent('')

		await startStream('d1')
		expect(status).toHaveTextContent('Streaming')

		await userEvent.click(screen.getByRole('button', { name: 'Stop' }))
		expect(status).toHaveTextContent('Stream stopped')

		await userEvent.click(screen.getByRole('button', { name: 'Start' }))
		latestCall().reject(new Error('connection dropped'))
		await vi.waitFor(() => expect(status).toHaveTextContent('Stream failed'))
	})

	it('ends the stream when the widget unmounts', async () => {
		const { unmount } = renderSubject()
		await startStream('d1')

		unmount()

		expect(latestCall().signal?.aborted).toBe(true)
	})

	it('ends the stream when the resource name changes', async () => {
		const { rerender } = renderSubject()
		await startStream('d1')

		await rerender({ partID: 'test-part', resourceName: 'other-board' })

		await vi.waitFor(() => expect(latestCall().signal?.aborted).toBe(true))
		expect(screen.getByRole('button', { name: 'Start' })).toBeEnabled()
	})

	it('draws a low tick with the disabled dot and a high tick with the success dot', async () => {
		renderSubject()
		await startStream('d1')

		latestCall().queue.push(
			{ pinName: 'd1', high: true, time: 1_000_000_000 },
			{ pinName: 'd2', high: false, time: 2_000_000_000 }
		)

		const lowDot = await screen.findByRole('img', { name: 'd2 level' })
		expect(lowDot).toHaveClass('status-dot-disabled')
		expect(lowDot.parentElement).toHaveTextContent('Low')
		const highDot = screen.getByRole('img', { name: 'd1 level' })
		expect(highDot).toHaveClass('status-dot-success')
		expect(highDot.parentElement).toHaveTextContent('High')
	})

	it('appends nothing from a stopped run after a new Start', async () => {
		renderSubject()
		await startStream('d1')
		const staleRun = latestCall()
		await userEvent.click(screen.getByRole('button', { name: 'Stop' }))
		await userEvent.click(screen.getByRole('button', { name: 'Start' }))
		expect(stream.calls).toHaveLength(2)

		staleRun.queue.push({ pinName: 'stale', high: true, time: 1_000_000_000 })
		latestCall().queue.push({ pinName: 'fresh', high: false, time: 2_000_000_000 })

		const list = await screen.findByRole('list', { name: 'Last 20 ticks, newest first' })
		expect(list.querySelectorAll('li')).toHaveLength(1)
		expect(list.textContent).toContain('fresh')
		expect(list.textContent).not.toContain('stale')
	})

	it("shows a stream error in the section's error indicator", async () => {
		renderSubject()
		await startStream('d1')

		latestCall().reject(new Error('connection dropped'))

		expect(
			await screen.findByRole('button', { name: 'StreamTicks: 1 error, copy to clipboard' })
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

describe('Board StreamTicks widget in a 320 px pane', () => {
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
