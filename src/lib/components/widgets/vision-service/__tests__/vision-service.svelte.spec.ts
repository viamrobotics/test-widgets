import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../vision-service.svelte'
import Pane from './__fixtures__/in-320-pane.svelte'

const state = vi.hoisted((): { data: Record<string, unknown>; cameras: string[] } => ({
	data: {},
	cameras: [],
}))

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createStreamClient: vi.fn(() => ({ mediaStream: undefined })),
		createResourceMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false, error: null })),
		createResourceQuery: vi.fn((_client: unknown, method: string) => ({
			get data() {
				return state.data[method]
			},
			isLoading: false,
			isSuccess: true,
			isError: false,
			isFetching: false,
			fetchStatus: 'idle',
			error: null,
			refetch: () => Promise.resolve({}),
		})),
		useResourceStatuses: vi.fn(() => ({
			get current() {
				return state.cameras.map((name) => ({ name: { name } }))
			},
		})),
		useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	}
})

const PROPS = { partID: 'test-part', resourceName: 'test-vision' }

const SECTIONS = [
	'CaptureAllFromCamera',
	'GetDetectionsFromCamera',
	'GetClassificationsFromCamera',
	'GetObjectPointClouds',
	'GetDetections',
	'GetClassifications',
	'GetProperties',
]

const callIfFunction = (value: unknown): unknown => (typeof value === 'function' ? value() : value)

const getCameraArg = (method: string) => {
	const call = vi.mocked(createResourceQuery).mock.calls.findLast(([, name]) => name === method)
	if (call === undefined) throw new Error(`No query was created for ${method}`)
	const args = callIfFunction(call[2])
	return Array.isArray(args) ? args[0] : undefined
}

const shownSections = () =>
	screen
		.getAllByRole('heading')
		.map((heading) => heading.textContent?.trim() ?? '')
		.filter((name) => SECTIONS.includes(name))

const answer = (flags: Record<string, boolean>) => {
	state.data.getProperties = {
		detectionsSupported: true,
		classificationsSupported: true,
		objectPointCloudsSupported: true,
		...flags,
	}
}

describe('VisionService composite', () => {
	beforeEach(() => {
		state.data = {}
		state.cameras = []
	})

	it('stacks the seven sections in order under one Camera row', () => {
		render(Subject, { props: PROPS })

		expect(shownSections()).toEqual(SECTIONS)
		expect(screen.getAllByRole('combobox', { name: 'Camera' })).toHaveLength(1)
	})

	it('shows all seven sections before GetProperties answers', () => {
		render(Subject, { props: PROPS })

		expect(shownSections()).toHaveLength(7)
	})

	it('shows all seven sections when every flag is supported', () => {
		answer({})

		render(Subject, { props: PROPS })

		expect(shownSections()).toEqual(SECTIONS)
	})

	it('hides the detection sections on detections_supported false', () => {
		answer({ detectionsSupported: false })

		render(Subject, { props: PROPS })

		expect(shownSections()).toEqual(
			SECTIONS.filter((name) => name !== 'GetDetectionsFromCamera' && name !== 'GetDetections')
		)
	})

	it('hides the classification sections on classifications_supported false', () => {
		answer({ classificationsSupported: false })

		render(Subject, { props: PROPS })

		expect(shownSections()).toEqual(
			SECTIONS.filter(
				(name) => name !== 'GetClassificationsFromCamera' && name !== 'GetClassifications'
			)
		)
	})

	it('hides GetObjectPointClouds on object_point_clouds_supported false', () => {
		answer({ objectPointCloudsSupported: false })

		render(Subject, { props: PROPS })

		expect(shownSections()).toEqual(SECTIONS.filter((name) => name !== 'GetObjectPointClouds'))
	})

	it('sends the first camera to the camera-taking widgets by default', () => {
		state.cameras = ['cam-1', 'cam-2']

		render(Subject, { props: PROPS })

		expect(getCameraArg('getDetectionsFromCamera')).toBe('cam-1')
		expect(getCameraArg('getClassificationsFromCamera')).toBe('cam-1')
	})

	it('sends a picked camera to the camera-taking widgets', async () => {
		state.cameras = ['cam-1', 'cam-2']

		render(Subject, { props: PROPS })
		await userEvent.click(screen.getByRole('combobox', { name: 'Camera' }))
		await userEvent.click(await screen.findByRole('option', { name: 'cam-2' }))

		expect(getCameraArg('getDetectionsFromCamera')).toBe('cam-2')
		expect(getCameraArg('getClassificationsFromCamera')).toBe('cam-2')
	})

	it('keeps the root and the pane within 320 px', () => {
		answer({})

		const { container } = render(Pane, { props: { widget: Subject } })

		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild ?? container
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})
})
