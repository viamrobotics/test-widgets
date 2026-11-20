import { fireEvent, render, screen } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../section-errors.svelte'
import Scoped from './section-errors-scoped.spec.svelte'

const error = (name: string, message: string) => {
	const instance = new Error(message)
	instance.name = name
	return instance
}

const notFound = () => error('ConnectionError', 'Resource not found')
const notPowered = () => error('RpcError', 'base is not powered')

const glyph = () => screen.getByRole('button').firstElementChild

const liveRegion = () => {
	const region = document.querySelector('[aria-live="polite"]')
	if (!region) throw new Error('<SectionErrors> rendered no polite live region')
	return region
}

const watchMutationTypes = (node: Node) => {
	const delivered: MutationRecord[] = []
	const observer = new MutationObserver((records) => {
		delivered.push(...records)
	})
	observer.observe(node, { childList: true, characterData: true, subtree: true })

	return () => [...delivered, ...observer.takeRecords()].map((record) => record.type)
}

describe('<SectionErrors>', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('reads as "No errors" with no count while idle', async () => {
		render(Subject, { errors: [] })

		const button = screen.getByRole('button', { name: 'No errors' })
		expect(button.textContent).not.toMatch(/\d/u)

		await fireEvent.focusIn(button)

		expect(screen.getByText('No errors')).toBeInTheDocument()
		expect(screen.queryByText('Click to copy')).not.toBeInTheDocument()
	})

	it('prefixes its name with the enclosing scope method', () => {
		render(Scoped, { method: 'IsMoving' })

		expect(screen.getByRole('button', { name: 'IsMoving: No errors' })).toBeInTheDocument()
	})

	it('keeps its plain name in a scope with no method', () => {
		render(Scoped, {})

		expect(screen.getByRole('button', { name: 'No errors' })).toBeInTheDocument()
	})

	it('names the count and lists each error in the tooltip', async () => {
		render(Subject, { errors: [notFound(), notPowered()] })

		const button = screen.getByRole('button', { name: '2 errors, copy to clipboard' })
		expect(button).toHaveTextContent('2')

		await fireEvent.focusIn(button)

		expect(screen.getByText('ConnectionError: Resource not found')).toBeInTheDocument()
		expect(screen.getByText('RpcError: base is not powered')).toBeInTheDocument()
		expect(screen.getByText('Click to copy')).toBeInTheDocument()
	})

	it('copies every line on click and shows the copied state for 750 ms', async () => {
		const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
		render(Subject, { errors: [notFound(), notPowered()] })

		await fireEvent.focusIn(screen.getByRole('button'))
		await fireEvent.click(screen.getByRole('button'))
		await vi.advanceTimersByTimeAsync(0)

		expect(writeText).toHaveBeenCalledWith(
			'ConnectionError: Resource not found\nRpcError: base is not powered'
		)
		expect(screen.getByRole('button', { name: 'Copied 2 errors' })).toBeInTheDocument()
		expect(screen.getByText('Copied')).toBeInTheDocument()

		await vi.advanceTimersByTimeAsync(750)

		expect(screen.getByRole('button', { name: '2 errors, copy to clipboard' })).toBeInTheDocument()
	})

	it('does not copy while idle', async () => {
		const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
		render(Subject, { errors: [] })

		await fireEvent.click(screen.getByRole('button'))
		await vi.advanceTimersByTimeAsync(0)

		expect(writeText).not.toHaveBeenCalled()
		expect(screen.getByRole('button', { name: 'No errors' })).toBeInTheDocument()
	})

	it('replays the arrival cue when the error set changes and not when it repeats', async () => {
		const { rerender } = render(Subject, { errors: [] })
		expect(glyph()).not.toHaveClass('arrival')

		await rerender({ errors: [notFound()] })
		const first = glyph()
		expect(first).toHaveClass('arrival')

		await rerender({ errors: [notFound()] })
		expect(glyph()).toBe(first)

		await rerender({ errors: [notFound(), notPowered()] })
		expect(glyph()).not.toBe(first)
		expect(glyph()).toHaveClass('arrival')
	})

	it('announces nothing through the live region while idle', () => {
		render(Subject, { errors: [] })

		expect(liveRegion().textContent).toBe('')
	})

	it('announces the count through the live region when errors arrive', async () => {
		const { rerender } = render(Subject, { errors: [] })

		await rerender({ errors: [notFound(), notPowered()] })

		expect(liveRegion().textContent).toBe('2 errors')
	})

	it('leaves the live region untouched when the same error arrives again', async () => {
		const { rerender } = render(Subject, { errors: [notFound()] })
		const mutationTypes = watchMutationTypes(liveRegion())

		await rerender({ errors: [notFound()] })

		expect(mutationTypes()).toEqual([])
	})

	it('announces the count again when a different error replaces the held one', async () => {
		const { rerender } = render(Subject, { errors: [notFound()] })
		const mutationTypes = watchMutationTypes(liveRegion())

		await rerender({ errors: [notPowered()] })

		expect(mutationTypes()).toContain('childList')
		expect(liveRegion().textContent).toBe('1 error')
	})
})
