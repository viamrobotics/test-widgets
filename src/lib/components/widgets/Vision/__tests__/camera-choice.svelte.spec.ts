import { robotApi } from '@viamrobotics/sdk'
import { type ResourceStatusesContext, useResourceStatuses } from '@viamrobotics/svelte-sdk'
import { flushSync } from 'svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createCameraChoice, DEFAULT_CAMERA_NAME } from '../camera-choice.svelte'

vi.mock('@viamrobotics/svelte-sdk', () => ({
	useResourceStatuses: vi.fn(),
}))

const statusesOf = (names: string[]): ResourceStatusesContext => ({
	current: names.map((name) => ({
		name: { name, namespace: 'rdk', type: 'component', subtype: 'camera', remotePath: [] },
		state: robotApi.ResourceStatus_State.READY,
		revision: '',
		error: '',
		reachability: robotApi.ResourceStatus_Reachability.REACHABLE,
	})),
})

let cleanup: (() => void) | undefined

const choose = (names: string[], defaultCamera?: string) => {
	vi.mocked(useResourceStatuses).mockReturnValue(statusesOf(names))
	let choice: ReturnType<typeof createCameraChoice> | undefined
	cleanup = $effect.root(() => {
		choice = createCameraChoice(
			() => 'part-1',
			() => defaultCamera
		)
	})
	if (!choice) throw new Error('createCameraChoice did not run')
	return choice
}

afterEach(() => {
	cleanup?.()
})

describe('createCameraChoice', () => {
	it("starts on the machine's first camera", () => {
		expect(choose(['cam-1', 'cam-2']).cameraName).toBe('cam-1')
	})

	it('starts on the default camera when the machine lists none', () => {
		expect(choose([]).cameraName).toBe(DEFAULT_CAMERA_NAME)
	})

	it('holds a pick of the default camera over the first camera', () => {
		const choice = choose(['cam-1'])

		choice.pick(DEFAULT_CAMERA_NAME)
		flushSync()

		expect(choice.cameraName).toBe(DEFAULT_CAMERA_NAME)
	})

	it('starts on the service default camera when the machine lists it', () => {
		expect(choose(['cam-1', 'cam-2'], 'cam-2').cameraName).toBe('cam-2')
	})

	it.each([
		{ defaultCamera: '', label: 'empty' },
		{ defaultCamera: 'cam-9', label: 'unknown' },
		{ defaultCamera: undefined, label: 'unanswered' },
	])('starts on the first camera when the default is $label', ({ defaultCamera }) => {
		expect(choose(['cam-1', 'cam-2'], defaultCamera).cameraName).toBe('cam-1')
	})

	it('holds a pick over the service default camera', () => {
		const choice = choose(['cam-1', 'cam-2'], 'cam-2')

		choice.pick('cam-1')
		flushSync()

		expect(choice.cameraName).toBe('cam-1')
	})

	it('holds a picked camera', () => {
		const choice = choose(['cam-1', 'cam-2'])

		choice.pick('cam-2')
		flushSync()

		expect(choice.cameraName).toBe('cam-2')
	})
})
