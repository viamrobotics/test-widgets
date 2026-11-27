import { render } from '@testing-library/svelte'
import { readable } from 'svelte/store'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../WebgamepadScene.svelte'

vi.mock('@threlte/extras', () => ({
	useGamepad: vi.fn(() => ({ on: vi.fn(), connected: readable(true) })),
}))

describe('InputController WebgamepadScene', () => {
	it('reports the gamepad connected, then gone when the scene is taken down', () => {
		const onConnectionChange = vi.fn()

		const { unmount } = render(Subject, { props: { onChange: vi.fn(), onConnectionChange } })
		expect(onConnectionChange).toHaveBeenLastCalledWith(true)

		unmount()
		expect(onConnectionChange).toHaveBeenLastCalledWith(false)
	})
})
