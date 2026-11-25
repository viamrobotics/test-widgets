import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../get-internal-state-widget.svelte'
import Pane from './__fixtures__/in-320-pane.svelte'

const BYTES_PER_KB = 1024

const { queryState } = vi.hoisted(() => ({
	queryState: {
		fileType: undefined as string | undefined,
		response: undefined as Uint8Array | undefined,
		isError: false,
		error: null as Error | null,
		refetchError: null as Error | null,
		fetchCount: 0,
		isFetching: false,
	},
}))

vi.mock('@viamrobotics/sdk', () => ({
	CameraClient: class {},
	SlamClient: class {},
	StreamClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createStreamClient: vi.fn(() => ({ current: undefined })),
	createResourceQuery: vi.fn((_client: unknown, method: string | symbol | number) => {
		if (String(method) === 'getProperties') {
			return {
				data: { internalStateFileType: queryState.fileType },
				isLoading: false,
				isError: false,
				error: null,
			}
		}
		return {
			data: undefined,
			isLoading: false,
			isFetching: queryState.isFetching,
			isError: queryState.isError,
			error: queryState.error,
			refetch: () => {
				queryState.fetchCount += 1
				return Promise.resolve({
					data: queryState.response,
					error: queryState.refetchError,
					isError: queryState.refetchError !== null,
				})
			},
		}
	}),
}))

const renderSubject = () =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-slam' } })

const downloadButton = () => screen.getByRole('button', { name: 'Download internal state' })

describe('SLAM GetInternalState widget', () => {
	const clickedLinks: HTMLAnchorElement[] = []

	beforeEach(() => {
		queryState.fileType = 'pbstream'
		queryState.response = new Uint8Array(2 * BYTES_PER_KB)
		queryState.isError = false
		queryState.error = null
		queryState.refetchError = null
		queryState.fetchCount = 0
		queryState.isFetching = false
		clickedLinks.length = 0
		vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function recordClick(
			this: HTMLAnchorElement
		) {
			clickedLinks.push(this)
		})
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('renders the GetInternalState heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetInternalState' })).toBeInTheDocument()
	})

	it('reads - with no unit before the first download, and fetches nothing', () => {
		renderSubject()

		expect(screen.getByRole('group', { name: 'Last download' })).toHaveTextContent('-')
		expect(screen.queryByText('KB')).not.toBeInTheDocument()
		expect(queryState.fetchCount).toBe(0)
	})

	it('fetches on press, saves the file, and reads its size in KB', async () => {
		renderSubject()

		await userEvent.click(downloadButton())

		await screen.findByText('KB')
		expect(queryState.fetchCount).toBe(1)
		expect(clickedLinks).toHaveLength(1)
		expect(clickedLinks[0]?.download).toBe('test-slam-internal-state.pbstream')
		const group = screen.getByRole('group', { name: 'Last download' })
		expect(within(group).getByText('2.0')).toBeInTheDocument()
		expect(within(group).getByText('KB')).toBeInTheDocument()
	})

	it('disables Download while the fetch is in flight', () => {
		queryState.isFetching = true

		renderSubject()

		expect(downloadButton()).toBeDisabled()
	})

	it('names the file with a leading-dot file type without doubling the dot', async () => {
		queryState.fileType = '.pbstream'
		renderSubject()

		await userEvent.click(downloadButton())

		expect(clickedLinks[0]?.download).toBe('test-slam-internal-state.pbstream')
	})

	it('falls back to a bin extension when the file type is empty', async () => {
		queryState.fileType = ''
		renderSubject()

		await userEvent.click(downloadButton())

		expect(clickedLinks[0]?.download).toBe('test-slam-internal-state.bin')
	})

	it('does not save or change the readout when the fetch returns nothing', async () => {
		queryState.response = undefined
		renderSubject()

		await userEvent.click(downloadButton())

		expect(clickedLinks).toHaveLength(0)
		expect(screen.getByRole('group', { name: 'Last download' })).toHaveTextContent('-')
	})

	it('saves nothing and keeps Last download after a failed refetch that still holds the earlier data', async () => {
		renderSubject()
		await userEvent.click(downloadButton())
		await screen.findByText('KB')
		queryState.response = new Uint8Array(5 * BYTES_PER_KB)
		queryState.refetchError = new Error('slam unreachable')

		await userEvent.click(downloadButton())

		await vi.waitFor(() => {
			expect(queryState.fetchCount).toBe(2)
		})
		expect(clickedLinks).toHaveLength(1)
		expect(screen.getByRole('group', { name: 'Last download' })).toHaveTextContent('2.0 KB')
	})

	it('shows the query error in the section indicator', () => {
		queryState.isError = true
		queryState.error = new Error('slam unreachable')

		renderSubject()

		expect(
			screen.getByRole('button', { name: 'GetInternalState: 1 error, copy to clipboard' })
		).toBeInTheDocument()
	})
})

describe('SLAM GetInternalState widget in a 320 px pane', () => {
	it('does not scroll horizontally', () => {
		render(Pane, { props: { widget: Subject } })

		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild ?? pane
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})
})
