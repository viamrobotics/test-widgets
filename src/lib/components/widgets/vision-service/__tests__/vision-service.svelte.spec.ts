import { render, screen } from '@testing-library/svelte'
import { MachineConnectionEvent } from '@viamrobotics/sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from './vision-service.spec.svelte'

vi.mock('@viamrobotics/svelte-sdk', () => ({
	useConnectionStatus: vi.fn(() => ({ current: MachineConnectionEvent.CONNECTED })),
	useResourceStatuses: vi.fn(() => ({
		current: [{ name: { name: 'cam-a' } }, { name: { name: 'cam-b' } }],
	})),
	createResourceClient: vi.fn(() => ({ current: undefined })),
	createResourceQuery: vi.fn(() => ({
		data: undefined,
		isLoading: false,
		isFetching: false,
		isError: false,
		error: null,
		refetch: vi.fn(),
	})),
}))

const partID = 'test-part'
const resourceName = 'test-vision'

const cameraOptions = () => {
	const select = screen.getByLabelText('Camera') as HTMLSelectElement
	return [...select.options].map((option) => option.text.trim())
}

describe('Vision service widget camera select', () => {
	it('lists every camera when the host does not know the dependencies', () => {
		render(Subject, { props: { partID, resourceName } })

		expect(cameraOptions()).toEqual(['Default camera', 'cam-a', 'cam-b'])
	})

	it('lists only the cameras among the dependencies', () => {
		render(Subject, {
			props: { partID, resourceName, getDependencies: () => ['cam-b', 'not-a-camera'] },
		})

		expect(cameraOptions()).toEqual(['Default camera', 'cam-b'])
	})

	it('lists only the default camera when no dependency is a camera', () => {
		render(Subject, { props: { partID, resourceName, getDependencies: () => [] } })

		expect(cameraOptions()).toEqual(['Default camera'])
	})
})
