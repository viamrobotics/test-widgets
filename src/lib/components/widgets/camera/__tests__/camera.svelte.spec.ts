import { render, screen } from '@testing-library/svelte'
import { MachineConnectionEvent } from '@viamrobotics/sdk'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from './camera.spec.svelte'

vi.mock('@viamrobotics/svelte-sdk', () => ({
	useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	useRobotClient: vi.fn(() => ({ current: undefined })),
	createResourceClient: vi.fn(() => ({ current: undefined })),
	createResourceQuery: vi.fn(() => ({
		data: undefined,
		isLoading: false,
		isError: false,
		error: null,
		refetch: vi.fn(),
	})),
	createStreamClient: vi.fn(),
}))

const partID = 'test-part'
const resourceName = 'test-camera'
const waitToStartFeedKey = `camera-wait-to-start-feed/${partID}/${resourceName}`

describe('Camera widget', () => {
	beforeEach(() => {
		localStorage.setItem(waitToStartFeedKey, 'true')
	})

	afterEach(() => {
		localStorage.removeItem(waitToStartFeedKey)
	})

	it('waits for the user to start the feed when the saved preference is off', () => {
		render(Subject, { props: { partID, resourceName } })

		expect(screen.getByRole('button', { name: /start feed/iu })).toBeInTheDocument()
	})

	it('starts the feed on mount with autoplay while leaving the saved preference off', () => {
		render(Subject, { props: { partID, resourceName, autoplay: true } })

		expect(screen.queryByRole('button', { name: /start feed/iu })).not.toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'No', pressed: true })).toBeInTheDocument()
		expect(localStorage.getItem(waitToStartFeedKey)).toBe('true')
	})
})
