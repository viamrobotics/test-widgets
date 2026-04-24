import type { QueryObserverResult } from '@tanstack/svelte-query'

import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'

import Subject from '../queries.svelte'

const createErrorQuery = (name: string, message: string): QueryObserverResult => {
	const error = new Error(message)
	error.name = name
	return {
		data: null,
		error,
		isError: true,
		isLoading: false,
		isPending: false,
		isSuccess: false,
		status: 'error',
	} as unknown as QueryObserverResult
}

const createSuccessQuery = (data: unknown = null): QueryObserverResult =>
	({
		data,
		error: null,
		isError: false,
		isLoading: false,
		isPending: false,
		isSuccess: true,
		status: 'success',
	}) as unknown as QueryObserverResult

const createLoadingQuery = (): QueryObserverResult =>
	({
		data: undefined,
		error: null,
		isError: false,
		isLoading: true,
		isPending: true,
		isSuccess: false,
		status: 'pending',
	}) as unknown as QueryObserverResult

describe('<Queries> serializeErrors guard', () => {
	it('guard passes: updates displayed errors when error content changes', async () => {
		const { rerender } = render(Subject, { queries: [createErrorQuery('ErrorA', 'First error')] })
		expect(screen.getByText('ErrorA: First error')).toBeInTheDocument()

		await rerender({ queries: [createErrorQuery('ErrorB', 'Second error')] })

		expect(screen.queryByText('ErrorA: First error')).not.toBeInTheDocument()
		expect(screen.getByText('ErrorB: Second error')).toBeInTheDocument()
	})

	it('guard blocks: preserves DOM element when same error content is re-provided', async () => {
		const { rerender } = render(Subject, {
			queries: [createErrorQuery('TestError', 'Same message')],
		})
		const element = screen.getByText('TestError: Same message')

		// Rerender with a new object that has identical content — guard should block state update
		await rerender({ queries: [createErrorQuery('TestError', 'Same message')] })

		expect(screen.getByText('TestError: Same message')).toBe(element)
	})

	it('guard resets: clears errors when all queries succeed', async () => {
		const { rerender } = render(Subject, { queries: [createErrorQuery('TestError', 'An error')] })
		expect(screen.getByText('TestError: An error')).toBeInTheDocument()

		await rerender({ queries: [createSuccessQuery()] })

		expect(screen.queryByText('TestError: An error')).not.toBeInTheDocument()
	})

	it('guard preserves errors during loading (errors are null while polling)', async () => {
		const { rerender } = render(Subject, { queries: [createErrorQuery('TestError', 'An error')] })
		expect(screen.getByText('TestError: An error')).toBeInTheDocument()

		// During polling queries may briefly be in loading state with null errors
		await rerender({ queries: [createLoadingQuery()] })

		expect(screen.getByText('TestError: An error')).toBeInTheDocument()
	})

	it('guard blocks: new error object with same content as existing does not update state', async () => {
		const { rerender } = render(Subject, {
			queries: [createErrorQuery('TestError', 'Duplicate content')],
		})
		const element = screen.getByText('TestError: Duplicate content')

		// A second error object with the same name+message is a duplicate — guard should block
		const newQuery = createErrorQuery('TestError', 'Duplicate content')
		await rerender({ queries: [newQuery] })

		expect(screen.getByText('TestError: Duplicate content')).toBe(element)
	})
})
