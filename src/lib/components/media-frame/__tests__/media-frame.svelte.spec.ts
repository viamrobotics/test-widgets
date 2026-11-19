import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import type { SectionErrorReporter } from '../../section/section-error-reporter'

import Host from './__fixtures__/media-frame-host.svelte'

interface FakePip {
	toggle: Mock<(key: string) => Promise<void>>
	setStream: Mock<(key: string, stream: MediaStream | null) => void>
	setRate: Mock<() => void>
	error: Error | undefined
	readyState: 'inactive' | 'loading' | 'active'
	resourceName: string | undefined
}

const pip = vi.hoisted(
	(): FakePip => ({
		toggle: vi.fn(async () => {}),
		setStream: vi.fn(),
		setRate: vi.fn(),
		error: undefined,
		readyState: 'inactive',
		resourceName: undefined,
	})
)

vi.mock('$lib/pip/context.svelte', () => ({
	providePip: () => pip,
	usePip: () => pip,
	hasPip: () => true,
}))

const PNG_CAPTURE = { binaryData: new Uint8Array([1, 2, 3]), mimeType: 'image/png' }

const addToDataset = () => ({
	capture: vi.fn(async () => PNG_CAPTURE),
	onConfirm: vi.fn(async () => {}),
	resourceName: 'camera-1',
	methodName: 'getImages',
})

const getFrame = () => screen.getByRole('group', { name: 'GetImages' })

beforeEach(() => {
	pip.error = undefined
})

describe('MediaFrame', () => {
	it('renders the media only when every prop is off', () => {
		render(Host)

		const frame = getFrame()
		expect(within(frame).getByTestId('media')).toBeInTheDocument()
		expect(within(frame).queryAllByRole('button')).toHaveLength(0)
		expect(within(frame).queryAllByRole('checkbox')).toHaveLength(0)
		expect(within(frame).queryByText(/fps$/)).not.toBeInTheDocument()
		expect(frame.children).toHaveLength(1)
	})

	it('sizes the media box at the aspect ratio, defaulting to 16 / 9', () => {
		const { unmount } = render(Host)
		expect(screen.getByTestId('media').parentElement?.style.aspectRatio).toBe('16 / 9')
		unmount()

		render(Host, { props: { aspectRatio: '1 / 1' } })
		expect(screen.getByTestId('media').parentElement?.style.aspectRatio).toBe('1 / 1')
	})

	it('renders each opt-in control when its prop is set', () => {
		render(Host, {
			props: {
				fps: 29.97,
				startAutomatically: false,
				screenshot: async () => PNG_CAPTURE,
				pictureInPicture: { key: 'camera-1' },
				addToDataset: addToDataset(),
				cursorPosition: false,
				withOverlay: true,
				withChildren: true,
			},
		})

		const frame = getFrame()
		expect(within(frame).getByText('30.0fps')).toBeInTheDocument()
		expect(
			within(frame).getByRole('checkbox', { name: 'Start feed automatically' })
		).toBeInTheDocument()
		expect(within(frame).getByRole('button', { name: 'Screenshot' })).toBeInTheDocument()
		expect(within(frame).getByRole('button', { name: 'Picture-in-picture' })).toBeInTheDocument()
		expect(within(frame).getByRole('button', { name: 'Add to dataset' })).toBeInTheDocument()
		expect(
			within(frame).getByRole('checkbox', { name: 'Mouse position tooltip' })
		).toBeInTheDocument()
		expect(within(frame).getByTestId('overlay')).toBeInTheDocument()
		expect(within(frame).getByTestId('host-controls')).toBeInTheDocument()
	})

	it('draws the overlay inside the media box', () => {
		render(Host, { props: { withOverlay: true } })

		expect(screen.getByTestId('overlay').parentElement).toBe(
			screen.getByTestId('media').parentElement
		)
	})

	it('writes the checkboxes back to their bindings', async () => {
		const user = userEvent.setup()
		render(Host, { props: { startAutomatically: false, cursorPosition: true } })

		const startBox = screen.getByRole('checkbox', { name: 'Start feed automatically' })
		const cursorBox = screen.getByRole('checkbox', { name: 'Mouse position tooltip' })
		expect(startBox).toHaveAttribute('aria-checked', 'false')
		expect(cursorBox).toHaveAttribute('aria-checked', 'true')

		await user.click(startBox)
		await user.click(cursorBox)

		expect(startBox).toHaveAttribute('aria-checked', 'true')
		expect(cursorBox).toHaveAttribute('aria-checked', 'false')
	})

	it('hides Picture-in-picture in Firefox', () => {
		vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
			'Mozilla/5.0 (Macintosh; rv:132.0) Gecko/20100101 Firefox/132.0'
		)
		render(Host, { props: { pictureInPicture: { key: 'camera-1' } } })

		expect(screen.queryByRole('button', { name: 'Picture-in-picture' })).not.toBeInTheDocument()
	})
})

describe('MediaFrame splash', () => {
	it('shows the start button and disables the actions until the media runs', async () => {
		const user = userEvent.setup()
		const onStart = vi.fn()
		render(Host, {
			props: {
				running: false,
				onStart,
				startLabel: 'Start point cloud',
				fps: 12,
				screenshot: async () => PNG_CAPTURE,
				pictureInPicture: { key: 'camera-1' },
				addToDataset: addToDataset(),
				withOverlay: true,
			},
		})

		expect(screen.getByRole('button', { name: 'Screenshot' })).toBeDisabled()
		expect(screen.getByRole('button', { name: 'Picture-in-picture' })).toBeDisabled()
		expect(screen.getByRole('button', { name: 'Add to dataset' })).toBeDisabled()
		expect(screen.queryByTestId('overlay')).not.toBeInTheDocument()
		expect(screen.queryByText('12.0fps')).not.toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Start point cloud' }))

		expect(onStart).toHaveBeenCalledOnce()
	})

	it('reads Start feed by default', () => {
		render(Host, { props: { running: false, onStart: vi.fn() } })

		expect(screen.getByRole('button', { name: 'Start feed' })).toBeInTheDocument()
	})

	it('shows no splash without onStart, or once running', async () => {
		const { rerender } = render(Host, { props: { running: false } })
		expect(screen.queryByRole('button', { name: 'Start feed' })).not.toBeInTheDocument()

		await rerender({ running: true, onStart: vi.fn() })
		expect(screen.queryByRole('button', { name: 'Start feed' })).not.toBeInTheDocument()
	})
})

describe('MediaFrame actions', () => {
	it('saves the screenshot under the label, the time, and the extension', async () => {
		const user = userEvent.setup()
		const downloads: string[] = []
		vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
			this: HTMLAnchorElement
		) {
			downloads.push(this.download)
		})
		render(Host, {
			props: {
				label: 'GetImages',
				screenshot: async () => ({ binaryData: new Uint8Array([1]), mimeType: 'image/jpeg' }),
			},
		})

		await user.click(screen.getByRole('button', { name: 'Screenshot' }))

		await vi.waitFor(() => expect(downloads).toHaveLength(1))
		expect(downloads[0]).toMatch(/^GetImages-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z\.jpg$/)
	})

	it('reports a failed screenshot to the section', async () => {
		const user = userEvent.setup()
		const reported: (() => Error | null)[] = []
		const reporter: SectionErrorReporter = {
			report: (getError) => {
				reported.push(getError)
				return () => {}
			},
		}
		render(Host, {
			props: {
				reporter,
				screenshot: async () => {
					throw new Error('GetImages timed out')
				},
			},
		})

		await user.click(screen.getByRole('button', { name: 'Screenshot' }))

		await vi.waitFor(() =>
			expect(reported.map((getError) => getError()?.message)).toContain('GetImages timed out')
		)
	})

	it('registers the host stream, then toggles picture-in-picture by key', async () => {
		const user = userEvent.setup()
		const stream = new MediaStream()
		render(Host, { props: { pictureInPicture: { key: 'pcd-point-cloud', stream: () => stream } } })

		await user.click(screen.getByRole('button', { name: 'Picture-in-picture' }))

		expect(pip.setStream).toHaveBeenCalledWith('pcd-point-cloud', stream)
		expect(pip.toggle).toHaveBeenCalledWith('pcd-point-cloud')
	})

	it('toggles pip without registering a stream when the host gives none', async () => {
		const user = userEvent.setup()
		render(Host, { props: { pictureInPicture: { key: 'camera-1' } } })

		await user.click(screen.getByRole('button', { name: 'Picture-in-picture' }))

		expect(pip.setStream).not.toHaveBeenCalled()
		expect(pip.toggle).toHaveBeenCalledWith('camera-1')
	})

	it('reports a failed picture-in-picture to the section', async () => {
		const user = userEvent.setup()
		const reported: (() => Error | null)[] = []
		const reporter: SectionErrorReporter = {
			report: (getError) => {
				reported.push(getError)
				return () => {}
			},
		}
		pip.toggle.mockImplementationOnce(async () => {
			pip.error = new Error('NotAllowedError')
		})
		render(Host, { props: { reporter, pictureInPicture: { key: 'camera-1' } } })

		await user.click(screen.getByRole('button', { name: 'Picture-in-picture' }))

		await vi.waitFor(() =>
			expect(reported.map((getError) => getError()?.message)).toContain('NotAllowedError')
		)
	})
})

describe('MediaFrame in a 320 px pane', () => {
	it('fits the frame root and the pane within 320 px with every control on', () => {
		render(Host, {
			props: {
				paneClass: 'w-80',
				fps: 30,
				startAutomatically: true,
				screenshot: async () => PNG_CAPTURE,
				pictureInPicture: { key: 'camera-1' },
				addToDataset: addToDataset(),
				cursorPosition: false,
				withOverlay: true,
				withChildren: true,
			},
		})
		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('The frame rendered no root element')

		expect(getComputedStyle(pane).width).toBe('320px')
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})
})
