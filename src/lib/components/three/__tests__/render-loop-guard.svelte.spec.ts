import { render } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'

import Host from './__fixtures__/render-loop-guard-host.svelte'

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const UNGUARDED_SETTLE_MS = 100

const mount = (guarded: boolean) => {
	const counter = { frames: 0, renders: 0 }
	const onError = vi.fn<(error: Error) => void>()
	render(Host, { props: { guarded, counter, throwFromFrame: 3, onError } })
	return { counter, onError }
}

describe('<RenderLoopGuard>', () => {
	it('keeps rendering while a task throws every frame and reports the error once', async () => {
		const { counter, onError } = mount(true)

		await vi.waitFor(() => expect(counter.frames).toBeGreaterThanOrEqual(3))
		await vi.waitFor(() => expect(counter.frames).toBeGreaterThan(10))
		await vi.waitFor(() => expect(counter.renders).toBeGreaterThan(10))

		expect(onError).toHaveBeenCalledOnce()
		expect(onError.mock.calls[0]?.[0].message).toBe('task boom')
	})

	it('control: without the guard the throwing frames never reach the render stage', async () => {
		const { counter, onError } = mount(false)
		// The unguarded throw surfaces as an uncaught error in the animation callback.
		const swallow = (event: ErrorEvent) => event.preventDefault()
		window.addEventListener('error', swallow)

		await vi.waitFor(() => expect(counter.frames).toBeGreaterThan(10))
		await wait(UNGUARDED_SETTLE_MS)
		window.removeEventListener('error', swallow)

		expect(counter.renders).toBe(2)
		expect(onError).not.toHaveBeenCalled()
	})
})
