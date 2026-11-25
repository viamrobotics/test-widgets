import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { tick } from 'svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
	fakeServices,
	makeConfig,
	onvifStreams,
	webcamModes,
} from './__fixtures__/discoveries-config'
import Pane from './__fixtures__/discovery-controls-pane.svelte'
import {
	previewArgs,
	resetDiscoveryControlsState,
	discoveryControlsState as state,
} from './__fixtures__/discovery-controls-state.svelte'

vi.mock('@viamrobotics/sdk', async (importOriginal) => ({
	...(await importOriginal<typeof import('@viamrobotics/sdk')>()),
	DiscoveryClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	const fixture = await import('./__fixtures__/discovery-controls-state.svelte')
	const fixtureState = fixture.discoveryControlsState

	const discoverQuery = () => ({
		get data() {
			return fixtureState.data
		},
		get isFetching() {
			return fixtureState.isFetching
		},
		get error() {
			return fixtureState.error
		},
		get fetchStatus() {
			return fixtureState.isFetching ? 'fetching' : 'idle'
		},
		isLoading: false,
		isSuccess: true,
		refetch: () => Promise.resolve({ data: fixtureState.data, error: null }),
	})

	const previewQuery = () => ({
		get data() {
			return fixtureState.previewResult
		},
		get isFetching() {
			return fixtureState.isPreviewFetching
		},
		error: null,
	})

	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceQuery: vi.fn((_client: unknown, method: string, args: unknown) => {
			if (method !== 'doCommand') return discoverQuery()
			if (typeof args === 'function') fixture.previewArgs.push(() => args())
			return previewQuery()
		}),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

const CAMERA = 'rdk:component:camera'

const block = (name: string) => screen.getByRole('group', { name })

const blockNames = () =>
	screen
		.getAllByRole('group')
		.filter((group) => !Object.hasOwn(group.dataset, 'toggleGroupRoot'))
		.map((group) => group.getAttribute('aria-labelledby'))
		.filter((id) => id !== null)
		.map((id) => document.querySelector(`#${CSS.escape(id)}`)?.textContent.trim())
		.filter((name) => name !== undefined && name !== '')

const readoutText = (scope: HTMLElement, label: string) =>
	within(scope)
		.getByRole('group', { name: label })
		.querySelector('.readout-value')
		?.textContent.trim()

const pickToggle = async (scope: HTMLElement, field: string, option: string) => {
	const group = within(scope).getByRole('radiogroup', { name: field })
	await userEvent.click(within(group).getByRole('radio', { name: option }))
}

const stubClipboard = () => vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()

const lastCopied = (writeText: ReturnType<typeof stubClipboard>): unknown =>
	JSON.parse(String(writeText.mock.lastCall?.[0]))

describe('ResourcePreview', () => {
	beforeEach(() => {
		resetDiscoveryControlsState()
	})

	it('shows one block per resource sorted by name, grouping indexed configs', () => {
		state.data = [...webcamModes, ...fakeServices, ...onvifStreams]

		render(Pane)

		expect(blockNames()).toEqual(['amcrest', 'fake1', 'fake2', 'IntegratedCamera'])
		expect(within(block('IntegratedCamera')).getByText('6 variants')).toBeInTheDocument()
	})

	it('draws ToggleButtons for two or three short values and a readout per fixed field', () => {
		state.data = webcamModes

		render(Pane)

		const camera = block('IntegratedCamera')
		expect(within(camera).queryAllByRole('combobox')).toHaveLength(0)
		const selected = (field: string) =>
			within(within(camera).getByRole('radiogroup', { name: field }))
				.getAllByRole('radio')
				.filter((radio) => radio.getAttribute('aria-checked') === 'true')
				.map((radio) => radio.textContent.trim())
		expect(selected('frame_rate')).toEqual(['30'])
		expect(selected('height_px')).toEqual(['480'])
		expect(selected('width_px')).toEqual(['640'])
		expect(readoutText(camera, 'name')).toBe('IntegratedCamera-0')
		expect(readoutText(camera, 'video_path')).toBe('video0')
	})

	it('lists every value of a toggle field as an option', () => {
		state.data = webcamModes
		render(Pane)

		const group = within(block('IntegratedCamera')).getByRole('radiogroup', { name: 'width_px' })

		expect(
			within(group)
				.getAllByRole('radio')
				.map((radio) => radio.textContent.trim())
		).toEqual(['640', '1280'])
	})

	it('draws a select when a field has four values', async () => {
		state.data = [10, 20, 30, 40].map((rate, index) =>
			makeConfig(`cam-${index}`, CAMERA, 'viam:camera:webcam', { frame_rate: rate })
		)
		render(Pane)

		await userEvent.click(within(block('cam')).getByRole('combobox', { name: 'frame_rate' }))

		const options = await screen.findAllByRole('option')
		expect(options.map((option) => option.textContent.trim())).toEqual(['10', '20', '30', '40'])
	})

	it('draws a select when a value is longer than 16 characters', async () => {
		state.data = ['/dev/video-short', '/dev/video-longer-than-sixteen'].map((path, index) =>
			makeConfig(`cam-${index}`, CAMERA, 'viam:camera:webcam', { video_path: path })
		)
		render(Pane)

		const camera = block('cam')
		expect(within(camera).getByRole('combobox', { name: 'video_path' })).toBeInTheDocument()
		expect(within(camera).queryByRole('radio')).not.toBeInTheDocument()
	})

	it('keeps a toggle at exactly 16 characters', () => {
		state.data = ['0123456789abcdef', 'fedcba9876543210'].map((path, index) =>
			makeConfig(`cam-${index}`, CAMERA, 'viam:camera:webcam', { video_path: path })
		)
		render(Pane)

		expect(within(block('cam')).getAllByRole('radio')).toHaveLength(2)
	})

	it('lands a pick on the variant that keeps the most other values', async () => {
		state.data = webcamModes
		render(Pane)

		await pickToggle(block('IntegratedCamera'), 'frame_rate', '60')

		expect(readoutText(block('IntegratedCamera'), 'name')).toBe('IntegratedCamera-4')
	})

	it('adds the picked variant own config, name included', async () => {
		state.data = webcamModes
		const onAddComponent = vi.fn()
		render(Pane, { props: { onAddComponent } })
		await pickToggle(block('IntegratedCamera'), 'frame_rate', '60')

		await userEvent.click(
			within(block('IntegratedCamera')).getByRole('button', { name: 'Add to config' })
		)

		expect(onAddComponent.mock.lastCall?.[0].toJson()).toEqual({
			name: 'IntegratedCamera-4',
			api: CAMERA,
			model: 'viam:camera:webcam',
			attributes: { video_path: 'video0', width_px: 640, height_px: 480, frame_rate: 60 },
		})
	})

	it('copies the picked variant as the resource', async () => {
		state.data = webcamModes
		const writeText = stubClipboard()
		render(Pane)
		await pickToggle(block('IntegratedCamera'), 'width_px', '1280')

		await userEvent.click(
			within(block('IntegratedCamera')).getByRole('button', { name: 'Copy resource' })
		)

		expect(lastCopied(writeText)).toEqual({
			name: 'IntegratedCamera-1',
			api: CAMERA,
			model: 'viam:camera:webcam',
			attributes: { video_path: 'video0', width_px: 1280, height_px: 720, frame_rate: 30 },
		})
	})

	it('copies the picked variant attributes', async () => {
		state.data = webcamModes
		const writeText = stubClipboard()
		render(Pane)
		await pickToggle(block('IntegratedCamera'), 'width_px', '1280')

		await userEvent.click(
			within(block('IntegratedCamera')).getByRole('button', { name: 'Copy attributes' })
		)

		expect(lastCopied(writeText)).toEqual({
			video_path: 'video0',
			width_px: 1280,
			height_px: 720,
			frame_rate: 30,
		})
	})

	it('has no Copy all configs button beside the refresh row', () => {
		state.data = [...webcamModes.slice(0, 2), ...fakeServices]

		render(Pane)

		expect(screen.queryByRole('button', { name: 'Copy all configs' })).not.toBeInTheDocument()
	})

	it('resets the pick when a new result no longer holds the picked variant', async () => {
		state.data = webcamModes
		render(Pane)
		await pickToggle(block('IntegratedCamera'), 'frame_rate', '60')

		state.data = webcamModes.slice(0, 3)
		await tick()

		expect(readoutText(block('IntegratedCamera'), 'name')).toBe('IntegratedCamera-0')
	})

	it('shows a single variant with no controls, no badge, and every field as a readout', () => {
		state.data = [
			makeConfig('USB20HDUVCWebCam', CAMERA, 'rdk:builtin:webcam', {
				format: 'MJPEG',
				width_px: 1280,
			}),
		]

		render(Pane)

		const camera = block('USB20HDUVCWebCam')
		expect(within(camera).queryAllByRole('combobox')).toHaveLength(0)
		expect(within(camera).queryByText(/variants/u)).not.toBeInTheDocument()
		expect(readoutText(camera, 'format')).toBe('MJPEG')
		expect(readoutText(camera, 'width_px')).toBe('1280')
	})

	it('offers Add to config with a handler', () => {
		state.data = [fakeServices[0]!]

		render(Pane, { props: { onAddComponent: vi.fn() } })

		expect(
			within(block('fake1')).getByRole('button', { name: 'Add to config' })
		).toBeInTheDocument()
	})

	it('offers only the copies without a handler', () => {
		state.data = [fakeServices[0]!]

		render(Pane)

		expect(
			within(block('fake1'))
				.getAllByRole('button')
				.map((button) => button.textContent.trim())
		).toEqual(['Copy resource', 'Copy attributes'])
	})

	it('reads No resources discovered and keeps the refresh row when none are found', () => {
		state.data = []

		render(Pane)

		expect(screen.getByText('No resources discovered')).toBeInTheDocument()
		expect(screen.getByRole('combobox', { name: 'Refresh rate' })).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'Copy all configs' })).not.toBeInTheDocument()
	})

	it('marks the refresh row busy with a bar on the first run', () => {
		state.isFetching = true

		render(Pane)

		expect(screen.getByRole('group', { name: 'Refresh discoveries' })).toHaveAttribute(
			'aria-busy',
			'true'
		)
		expect(screen.getByRole('progressbar', { name: 'Discovering resources' })).toBeInTheDocument()
		expect(blockNames()).toEqual([])
	})

	it('keeps the blocks under the bar on a later run', () => {
		state.data = fakeServices
		state.isFetching = true

		render(Pane)

		expect(screen.getByRole('progressbar', { name: 'Discovering resources' })).toBeInTheDocument()
		expect(blockNames()).toEqual(['fake1', 'fake2'])
	})

	it('sends a failed discovery to the indicator', () => {
		state.data = []
		state.error = new Error('discovery failed')

		render(Pane)

		expect(screen.getByRole('button', { name: '1 error, copy to clipboard' })).toBeInTheDocument()
	})

	it('sends a failed copy to the indicator', async () => {
		state.data = [fakeServices[0]!]
		vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'))
		render(Pane)

		await userEvent.click(within(block('fake1')).getByRole('button', { name: 'Copy resource' }))

		expect(
			await screen.findByRole('button', { name: '1 error, copy to clipboard' })
		).toBeInTheDocument()
	})

	it('renders the host preview for the selected variant with the preview text', () => {
		state.data = webcamModes
		state.previewResult = { preview: 'preview-a' }

		render(Pane, { props: { withPreview: true } })

		expect(
			within(block('IntegratedCamera')).getByText('IntegratedCamera-0: preview-a')
		).toBeInTheDocument()
	})

	it('passes no preview text when the result holds no preview string', () => {
		state.data = [fakeServices[0]!]
		state.previewResult = { preview: 42 }

		render(Pane, { props: { withPreview: true } })

		expect(within(block('fake1')).getByText('fake1: none')).toBeInTheDocument()
	})

	it('shows a bar while the preview loads', () => {
		state.data = [fakeServices[0]!]
		state.isPreviewFetching = true

		render(Pane, { props: { withPreview: true } })

		expect(
			within(block('fake1')).getByRole('progressbar', { name: 'Loading preview' })
		).toBeInTheDocument()
		expect(within(block('fake1')).getByText('fake1: loading')).toBeInTheDocument()
	})

	it('reloads the preview through the preview DoCommand when the pick changes', async () => {
		state.data = webcamModes
		render(Pane, { props: { withPreview: true } })

		await pickToggle(block('IntegratedCamera'), 'frame_rate', '60')

		expect(previewArgs.at(-1)?.()).toEqual([
			{
				command: 'preview',
				attributes: { video_path: 'video0', width_px: 640, height_px: 480, frame_rate: 60 },
			},
		])
		expect(
			within(block('IntegratedCamera')).getByText('IntegratedCamera-4: none')
		).toBeInTheDocument()
	})

	it('loads no preview without a componentPreview snippet', () => {
		state.data = webcamModes

		render(Pane)

		expect(previewArgs).toHaveLength(0)
	})

	it('puts two blocks side by side from @2xl', () => {
		state.data = [...onvifStreams, ...webcamModes]

		render(Pane, { props: { isWide: true } })

		expect(block('amcrest').getBoundingClientRect().top).toBe(
			block('IntegratedCamera').getBoundingClientRect().top
		)
	})

	it('keeps the root and the pane within 320 px with long names and values', () => {
		state.data = [
			makeConfig(
				'HIKVISION-DS2CD2043G2I-G12345678-with-a-very-long-discovered-name',
				CAMERA,
				'viam:viamrtsp:rtsp',
				{ rtsp_address: 'rtsp://192.168.1.64:554/Streaming/Channels/101/with/a/long/path' }
			),
			...webcamModes,
		]
		const { container } = render(Pane, { props: { onAddComponent: vi.fn() } })

		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild ?? container
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})
})
