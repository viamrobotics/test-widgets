import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'

import type { SectionQuery } from '../section/use-section-errors.svelte'

import Subject from './api-section-error.spec.svelte'
import Queried from './api-section-queries.spec.svelte'
import Skeleton from './api-section-skeleton.spec.svelte'

const errorQuery = (name: string, message: string): SectionQuery => {
	const error = new Error(message)
	error.name = name
	return { error, fetchStatus: 'idle', isLoading: false, isSuccess: false }
}

const successQuery = (): SectionQuery => ({
	error: null,
	fetchStatus: 'idle',
	isLoading: false,
	isSuccess: true,
})

const loadingQuery = (): SectionQuery => ({
	error: null,
	fetchStatus: 'fetching',
	isLoading: true,
	isSuccess: false,
})

// An `enabled: false` query never fetches, so it never succeeds.
const disabledQuery = (): SectionQuery => ({
	error: null,
	fetchStatus: 'idle',
	isLoading: false,
	isSuccess: false,
})

const notFound = () => errorQuery('ConnectionError', 'Resource not found')

const indicator = (name: string) => screen.getByRole('button', { name })

describe('<ApiSection>', () => {
	it('contains a render error to its own section so sibling sections still render', () => {
		render(Subject)

		expect(screen.getByRole('heading', { name: 'IsMoving' })).toBeInTheDocument()
		expect(screen.getByText(/something went wrong/iu)).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: 'Stop' })).toBeInTheDocument()
		expect(screen.getByText('still standing')).toBeInTheDocument()
	})

	it('links the method heading to its docs and renders the subheading and content', () => {
		render(Subject)

		expect(screen.getByRole('heading', { name: 'GetPosition' })).toBeInTheDocument()
		expect(screen.getByRole('link', { name: 'GetPosition' })).toHaveAttribute(
			'href',
			expect.stringContaining('servo')
		)
		expect(screen.getByText('Where the servo is')).toBeInTheDocument()
		expect(screen.getByText('Updates automatically')).toBeInTheDocument()
	})

	it('keeps the content and raises the indicator when a query fails', async () => {
		render(Queried, { queries: [notFound()] })

		expect(screen.getByText('content')).toBeInTheDocument()
		expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()

		await fireEvent.focus(indicator('1 error, copy to clipboard'))

		expect(screen.getByText('ConnectionError: Resource not found')).toBeInTheDocument()
	})

	it('counts one error when two queries fail the same way', () => {
		render(Queried, { queries: [notFound(), notFound()] })

		expect(indicator('1 error, copy to clipboard')).toBeInTheDocument()
	})

	it('lists every distinct error when queries fail differently', async () => {
		render(Queried, {
			queries: [notFound(), errorQuery('ConnectionError', 'Resource unhealthy')],
		})

		await fireEvent.focus(indicator('2 errors, copy to clipboard'))

		expect(screen.getByText('ConnectionError: Resource not found')).toBeInTheDocument()
		expect(screen.getByText('ConnectionError: Resource unhealthy')).toBeInTheDocument()
	})

	it('shows a mutation error through the same indicator', async () => {
		const lastError = new Error('base is not powered')
		lastError.name = 'RpcError'
		render(Queried, { queries: [successQuery()], lastError })

		await fireEvent.focus(indicator('1 error, copy to clipboard'))

		expect(screen.getByText('RpcError: base is not powered')).toBeInTheDocument()
	})

	it('shows the placeholder instead of the content while a query is on its first load', () => {
		render(Queried, { queries: [loadingQuery(), successQuery()] })

		expect(screen.getByRole('progressbar')).toBeInTheDocument()
		expect(screen.queryByText('content')).not.toBeInTheDocument()
	})

	it('holds the error, not the placeholder, while a query that never succeeded refetches', async () => {
		const { rerender } = render(Queried, { queries: [notFound()] })

		await rerender({ queries: [loadingQuery()] })

		expect(indicator('1 error, copy to clipboard')).toBeInTheDocument()
		expect(screen.getByText('content')).toBeInTheDocument()
		expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
	})

	it('clears the error once every query succeeds', async () => {
		const { rerender } = render(Queried, { queries: [notFound(), successQuery()] })
		expect(indicator('1 error, copy to clipboard')).toBeInTheDocument()

		await rerender({ queries: [successQuery(), successQuery()] })

		expect(indicator('No errors')).toBeInTheDocument()
		expect(screen.getByText('content')).toBeInTheDocument()
	})

	it('clears the error once the failing query recovers, even beside a disabled query', async () => {
		const { rerender } = render(Queried, { queries: [notFound(), disabledQuery()] })
		expect(indicator('1 error, copy to clipboard')).toBeInTheDocument()

		await rerender({ queries: [successQuery(), disabledQuery()] })

		expect(indicator('No errors')).toBeInTheDocument()
	})
})

describe('<ApiSection skeleton>', () => {
	const loadingBar = () => screen.queryByTestId('section-placeholder-loading')

	it('pulses the placeholder while a query is on its first load', () => {
		render(Skeleton, { queries: [loadingQuery()] })

		expect(loadingBar()).toBeInTheDocument()
		expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
	})

	it('reads "No data" without a pulse when the first load failed', () => {
		render(Skeleton, { queries: [notFound()] })

		expect(loadingBar()).not.toBeInTheDocument()
		expect(screen.getByText('No data')).toBeInTheDocument()
	})

	it('never pulses for a disabled query, which has no data and is not loading', () => {
		render(Skeleton, { queries: [disabledQuery()] })

		expect(loadingBar()).not.toBeInTheDocument()
		expect(screen.getByText('No data')).toBeInTheDocument()
	})
})
