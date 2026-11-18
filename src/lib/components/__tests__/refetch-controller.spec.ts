import type { QueryObserverResult } from '@tanstack/svelte-query'
import type { ComponentProps } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { PersistedState } from 'runed'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../refetch-controller.svelte'
import {
	type RefetchInterval,
	RefetchIntervals,
	RefetchRates,
} from '../refetch-interval-store.svelte'

const renderSubject = (props: ComponentProps<typeof Subject>) => {
	return render(Subject, props)
}

const createSubjectProps = () => {
	localStorage.removeItem('refetch-controller-spec')
	const refetchInterval = new PersistedState<RefetchInterval>('refetch-controller-spec', 1000)

	const queryFetchSpy = vi.fn()
	const mockQuery: QueryObserverResult = {
		data: 'Success',
		error: null,
		isError: false,
		isLoading: false,
		isPending: false,
		isSuccess: true,
		status: 'success',
		refetch: queryFetchSpy.mockResolvedValue({ data: 'Success' }),
	} as unknown as QueryObserverResult

	return {
		props: { queries: [mockQuery], refetchInterval },
		queryFetchSpy,
	}
}

describe('<RefetchController>', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
	})

	it('stops refetching when pause is clicked', async () => {
		const { props } = createSubjectProps()
		renderSubject(props)

		const pauseButton = screen.getByRole('button', { name: 'Pause' })
		await user.click(pauseButton)
		expect(props.refetchInterval.current).toBe(false)
	})

	it('updates refetchInterval when an option is selected', async () => {
		const pick = async (name: string) => {
			await user.click(screen.getByRole('combobox', { name: 'Refresh rate' }))
			await user.click(await screen.findByRole('option', { name }))
		}
		const { props } = createSubjectProps()
		renderSubject({ ...props, allowLive: true })

		await user.click(screen.getByRole('combobox', { name: 'Refresh rate' }))
		const options = await screen.findAllByRole('option')

		expect(options[0]).toHaveAccessibleName(RefetchRates.LIVE)
		expect(options[1]).toHaveAccessibleName(RefetchRates.ONE_SEC)
		expect(options[2]).toHaveAccessibleName(RefetchRates.FIVE_SEC)
		expect(options[3]).toHaveAccessibleName(RefetchRates.MANUAL)
		await user.keyboard('{Escape}')

		await pick(RefetchRates.MANUAL)
		expect(props.refetchInterval.current).toBe(RefetchIntervals.MANUAL)
		await pick(RefetchRates.ONE_SEC)
		expect(props.refetchInterval.current).toBe(RefetchIntervals.ONE_SEC)
		await pick(RefetchRates.FIVE_SEC)
		expect(props.refetchInterval.current).toBe(RefetchIntervals.FIVE_SEC)
		await pick(RefetchRates.LIVE)
		expect(props.refetchInterval.current).toBe(RefetchIntervals.LIVE)
	})

	it('does not render a live option unless allowLive is set', async () => {
		const { props } = createSubjectProps()
		renderSubject(props)
		await user.click(screen.getByRole('combobox', { name: 'Refresh rate' }))
		await screen.findAllByRole('option')
		expect(screen.queryByRole('option', { name: RefetchRates.LIVE })).not.toBeInTheDocument()
	})

	it('offers Live in the list when allowLive is set', async () => {
		const { props } = createSubjectProps()
		renderSubject({ ...props, allowLive: true })
		await user.click(screen.getByRole('combobox', { name: 'Refresh rate' }))
		expect(await screen.findByRole('option', { name: RefetchRates.LIVE })).toBeInTheDocument()
	})

	it('refetches the query when the manual refetch button is pressed', async () => {
		const { props, queryFetchSpy } = createSubjectProps()
		renderSubject(props)

		const pauseButton = screen.getByRole('button', { name: 'Pause' })
		await user.click(pauseButton)
		const refetchButton = screen.getByRole('button', { name: 'Refresh' })
		await user.click(refetchButton)
		await user.click(refetchButton)
		await user.click(refetchButton)
		expect(queryFetchSpy).toHaveBeenNthCalledWith(3)
	})
})
