import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'

import type { SectionQuery } from '../use-section-errors.svelte'

import Queried from '../../__tests__/ApiSectionQueries.spec.svelte'
import Hosted from './SectionScope.spec.svelte'
import Docs from './SectionScopeDocs.spec.svelte'
import Nested from './SectionScopeNested.spec.svelte'

const notPowered = () => {
	const error = new Error('motor is not powered')
	error.name = 'RpcError'
	return error
}

const loadingQuery = (): SectionQuery => ({
	error: null,
	fetchStatus: 'fetching',
	isLoading: true,
	isSuccess: false,
})

const successQuery = (): SectionQuery => ({
	error: null,
	fetchStatus: 'idle',
	isLoading: false,
	isSuccess: true,
})

const failedQuery = (): SectionQuery => ({
	error: notPowered(),
	fetchStatus: 'idle',
	isLoading: false,
	isSuccess: false,
})

const header = () => within(screen.getByTestId('pane-header'))
const body = () => within(screen.getByTestId('pane-body'))

describe('<ApiSection> inside a host <Section.Scope>', () => {
	it('renders its body only, with no heading row or subheading', () => {
		render(Hosted)

		expect(body().getByRole('button', { name: 'Execute' })).toBeInTheDocument()
		expect(body().queryByRole('heading')).not.toBeInTheDocument()
		expect(body().queryByRole('button', { name: /error/u })).not.toBeInTheDocument()
		expect(screen.queryByText('Move continuously')).not.toBeInTheDocument()
	})

	it("hands its method to the host's header as plain text beside a docs link", () => {
		render(Hosted)

		expect(header().getByRole('heading', { name: 'SetPower' })).toBeInTheDocument()
		expect(header().queryByRole('link', { name: 'SetPower' })).not.toBeInTheDocument()
		expect(header().getByRole('link', { name: 'SetPower docs' })).toHaveAttribute(
			'href',
			'https://docs.viam.com/reference/apis/components/motor/#setpower'
		)
	})

	it("raises its mutation error on the host's indicator", async () => {
		const { rerender } = render(Hosted)
		expect(header().getByRole('button', { name: 'SetPower: No errors' })).toBeInTheDocument()

		await rerender({ mutationError: notPowered() })

		const indicator = header().getByRole('button', { name: 'SetPower: 1 error, copy to clipboard' })
		await fireEvent.focusIn(indicator)
		expect(screen.getByText('RpcError: motor is not powered')).toBeInTheDocument()
	})

	it('withdraws its method and errors from the host when it unmounts', async () => {
		const { rerender } = render(Hosted, { mutationError: notPowered() })

		await rerender({ mutationError: notPowered(), showBody: false })

		expect(header().queryByRole('link', { name: 'SetPower docs' })).not.toBeInTheDocument()
		expect(header().getByRole('button', { name: 'No errors' })).toBeInTheDocument()
	})
})

describe('<Section.Loading>', () => {
	it('shows on the first load and keeps the controls drawn under aria-busy', () => {
		render(Hosted, { queries: [loadingQuery()] })

		expect(body().getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument()
		const execute = body().getByRole('button', { name: 'Execute' })
		expect(execute.parentElement).toHaveAttribute('aria-busy', 'true')
	})

	it('hides once the first load succeeds', async () => {
		const { rerender } = render(Hosted, { queries: [loadingQuery()] })

		await rerender({ queries: [successQuery()] })

		expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
	})

	it('stays hidden while a query that failed refetches', async () => {
		const { rerender } = render(Hosted, { queries: [failedQuery()] })

		await rerender({ queries: [loadingQuery()] })

		expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
		expect(
			header().getByRole('button', { name: 'SetPower: 1 error, copy to clipboard' })
		).toBeInTheDocument()
	})
})

describe('<Section.Docs>', () => {
	it('exposes the description as the docs link’s accessible description', async () => {
		render(Docs, { description: 'Reports the position of an encoded motor.' })

		const link = screen.getByRole('link', { name: 'GetPosition docs' })
		link.focus()

		await waitFor(() =>
			expect(link).toHaveAccessibleDescription('Reports the position of an encoded motor.')
		)
	})

	it('has no accessible description when the method has none', async () => {
		render(Docs)

		const link = screen.getByRole('link', { name: 'GetPosition docs' })
		link.focus()

		expect(link).not.toHaveAttribute('aria-describedby')
	})
})

describe('<ApiSection> with no host scope', () => {
	it('renders its own heading row with the method link and indicator, and no docs button', () => {
		render(Queried, { queries: [successQuery()] })

		expect(screen.getByRole('heading', { name: 'GetPosition' })).toBeInTheDocument()
		expect(screen.getByRole('link', { name: 'GetPosition' })).toHaveAttribute(
			'href',
			'https://docs.viam.com/reference/apis/components/servo/#getposition'
		)
		expect(screen.getByRole('button', { name: 'GetPosition: No errors' })).toBeInTheDocument()
		expect(screen.queryByRole('link', { name: 'GetPosition docs' })).not.toBeInTheDocument()
	})
})

describe('<ApiSection> nested in another <ApiSection>', () => {
	const inner = () => within(screen.getByTestId('inner'))
	const indicatorNames = () =>
		screen
			.getAllByRole('button', { name: /error/u })
			.map((button) => button.getAttribute('aria-label'))

	it('keeps its own heading row and indicator', () => {
		render(Nested)

		expect(inner().getByRole('heading', { name: 'IsPowered' })).toBeInTheDocument()
		expect(inner().getByRole('button', { name: 'IsPowered: No errors' })).toBeInTheDocument()
		expect(indicatorNames()).toEqual(['IsMoving: No errors', 'IsPowered: No errors'])
	})

	it('raises its mutation error on its own indicator, not the outer one', async () => {
		const { rerender } = render(Nested)

		await rerender({ innerError: notPowered() })

		expect(
			inner().getByRole('button', { name: 'IsPowered: 1 error, copy to clipboard' })
		).toBeInTheDocument()
		expect(indicatorNames()).toEqual([
			'IsMoving: No errors',
			'IsPowered: 1 error, copy to clipboard',
		])
	})
})
