import { render, screen } from '@testing-library/svelte'
import { createResourceMutation } from '@viamrobotics/svelte-sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../move-widget.svelte'

vi.mock('@viamrobotics/sdk', () => ({
	MotionClient: class {},
	Constraints: class {},
	WorldState: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({ error: null, isPending: false, mutate: vi.fn() })),
	useRobotClient: vi.fn(() => ({ current: {} })),
	createRobotQuery: vi.fn(() => ({ data: [] })),
}))

describe('Motion Move widget', () => {
	it('creates a resource mutation for move', () => {
		render(Subject, { props: { partID: 'test-part', resourceName: 'test-motion' } })

		expect(createResourceMutation).toHaveBeenCalledWith(expect.anything(), 'move')
		expect(screen.getAllByRole('spinbutton')).toHaveLength(7)
	})
})
