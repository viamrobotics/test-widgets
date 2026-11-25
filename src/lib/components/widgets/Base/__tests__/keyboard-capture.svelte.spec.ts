import { afterEach, describe, expect, it, vi } from 'vitest'

import { createKeyboardCapture, type KeyboardCapture } from '../keyboard-capture.svelte'

describe('createKeyboardCapture', () => {
	const created: KeyboardCapture[] = []

	const create = (onRelease = vi.fn()) => {
		const capture = createKeyboardCapture(onRelease)
		created.push(capture)
		return { capture, onRelease }
	}

	afterEach(() => {
		for (const capture of created.splice(0)) {
			capture.release()
		}
	})

	it('starts idle and captures on engage', () => {
		const { capture } = create()

		expect(capture.isCaptured).toBe(false)
		capture.engage()
		expect(capture.isCaptured).toBe(true)
	})

	it('calls onRelease once when a held capture is released', () => {
		const { capture, onRelease } = create()

		capture.engage()
		capture.release()
		capture.release()

		expect(capture.isCaptured).toBe(false)
		expect(onRelease).toHaveBeenCalledOnce()
	})

	it('does not call onRelease when released while idle', () => {
		const { capture, onRelease } = create()

		capture.release()

		expect(onRelease).not.toHaveBeenCalled()
	})

	it('toggles between captured and idle', () => {
		const { capture } = create()

		capture.toggle()
		expect(capture.isCaptured).toBe(true)
		capture.toggle()
		expect(capture.isCaptured).toBe(false)
	})

	it('lets one control hold the keys at a time', () => {
		const first = create()
		const second = create()

		first.capture.engage()
		second.capture.engage()

		expect(first.capture.isCaptured).toBe(false)
		expect(first.onRelease).toHaveBeenCalledOnce()
		expect(second.capture.isCaptured).toBe(true)
		expect(second.onRelease).not.toHaveBeenCalled()
	})

	it('keeps the new holder when the released control releases again', () => {
		const first = create()
		const second = create()
		const third = create()

		first.capture.engage()
		second.capture.engage()
		first.capture.release()
		third.capture.engage()

		expect(second.capture.isCaptured).toBe(false)
		expect(second.onRelease).toHaveBeenCalledOnce()
		expect(third.capture.isCaptured).toBe(true)
	})

	it('does not release itself when engaged twice', () => {
		const { capture, onRelease } = create()

		capture.engage()
		capture.engage()

		expect(capture.isCaptured).toBe(true)
		expect(onRelease).not.toHaveBeenCalled()
	})
})
