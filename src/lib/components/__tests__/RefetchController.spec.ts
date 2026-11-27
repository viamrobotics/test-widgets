import type { QueryObserverResult } from '@tanstack/svelte-query'
import type { ComponentProps } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { PersistedState } from 'runed'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
	type RefetchInterval,
	RefetchIntervals,
	RefetchRates,
} from '../refetch-interval-store.svelte'
import Subject from '../RefetchController.svelte'

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

// Long enough for the first refresh's continuation to run, so a missing in-flight count would show.
const FIRST_SETTLE_WAIT_MS = 50

describe('<RefetchController>', () => {
	let user: ReturnType<typeof userEvent.setup>

	const pick = async (name: string) => {
		await user.click(screen.getByRole('combobox', { name: 'Updates' }))
		await user.click(await screen.findByRole('option', { name }))
	}

	beforeEach(() => {
		user = userEvent.setup()
	})

	it('reads Updates beside the rate while polling', () => {
		const { props } = createSubjectProps()
		renderSubject(props)

		expect(screen.getByText('Updates')).toBeInTheDocument()
		expect(screen.getByRole('combobox', { name: 'Updates' })).toHaveTextContent(
			RefetchRates.ONE_SEC
		)
		expect(screen.queryByRole('button', { name: 'Refresh' })).not.toBeInTheDocument()
	})

	it('pauses on Pause, reads and announces Paused, and keeps focus on the same button', async () => {
		const { props } = createSubjectProps()
		renderSubject(props)

		const toggle = screen.getByRole('button', { name: 'Pause' })
		await user.click(toggle)

		expect(props.refetchInterval.current).toBe(false)
		expect(screen.getByText('Paused')).toBeInTheDocument()
		expect(screen.queryByRole('combobox', { name: 'Updates' })).not.toBeInTheDocument()
		expect(toggle).toHaveAccessibleName('Resume')
		expect(toggle).toHaveFocus()
		expect(screen.getByRole('status')).toHaveTextContent('Updates paused')

		await user.click(toggle)

		expect(screen.getByRole('status')).toHaveTextContent('Updates resumed')
	})

	it('resumes at the rate it was paused from', async () => {
		const { props } = createSubjectProps()
		renderSubject(props)
		await pick(RefetchRates.FIVE_SEC)

		await user.click(screen.getByRole('button', { name: 'Pause' }))
		await user.click(screen.getByRole('button', { name: 'Resume' }))

		expect(props.refetchInterval.current).toBe(RefetchIntervals.FIVE_SEC)
	})

	it('resumes at one second when it loads paused', async () => {
		const { props } = createSubjectProps()
		props.refetchInterval.current = RefetchIntervals.MANUAL
		renderSubject(props)

		await user.click(screen.getByRole('button', { name: 'Resume' }))

		expect(props.refetchInterval.current).toBe(RefetchIntervals.ONE_SEC)
	})

	it('lists the rates without a manual option and sets the one picked', async () => {
		const { props } = createSubjectProps()
		renderSubject({ ...props, allowLive: true })

		await user.click(screen.getByRole('combobox', { name: 'Updates' }))
		const options = await screen.findAllByRole('option')
		expect(options.map((option) => option.textContent.trim())).toEqual([
			RefetchRates.LIVE,
			RefetchRates.HALF_SEC,
			RefetchRates.ONE_SEC,
			RefetchRates.FIVE_SEC,
		])
		await user.keyboard('{Escape}')

		await pick(RefetchRates.HALF_SEC)
		expect(props.refetchInterval.current).toBe(RefetchIntervals.HALF_SEC)
		await pick(RefetchRates.FIVE_SEC)
		expect(props.refetchInterval.current).toBe(RefetchIntervals.FIVE_SEC)
		await pick(RefetchRates.LIVE)
		expect(props.refetchInterval.current).toBe(RefetchIntervals.LIVE)
	})

	it('drops a stored live rate to one second when live is not offered', async () => {
		const { props } = createSubjectProps()
		props.refetchInterval.current = RefetchIntervals.LIVE
		renderSubject(props)

		await vi.waitFor(() => {
			expect(props.refetchInterval.current).toBe(RefetchIntervals.ONE_SEC)
		})
		expect(screen.getByRole('combobox', { name: 'Updates' })).toHaveTextContent(
			RefetchRates.ONE_SEC
		)
	})

	it('does not render a live option unless allowLive is set', async () => {
		const { props } = createSubjectProps()
		renderSubject(props)
		await user.click(screen.getByRole('combobox', { name: 'Updates' }))
		await screen.findAllByRole('option')
		expect(screen.queryByRole('option', { name: RefetchRates.LIVE })).not.toBeInTheDocument()
	})

	it('refetches the query on each Refresh press while paused, then announces Refreshed', async () => {
		const { props, queryFetchSpy } = createSubjectProps()
		renderSubject(props)

		await user.click(screen.getByRole('button', { name: 'Pause' }))
		const refetchButton = screen.getByRole('button', { name: 'Refresh' })
		await user.click(refetchButton)
		await user.click(refetchButton)
		await user.click(refetchButton)

		expect(queryFetchSpy).toHaveBeenCalledTimes(3)
		expect(refetchButton).not.toHaveAttribute('aria-busy')
		await vi.waitFor(() => {
			expect(screen.getByRole('status')).toHaveTextContent('Refreshed')
		})
	})

	it('holds Refreshing until the last of two overlapping refreshes settles', async () => {
		const { props, queryFetchSpy } = createSubjectProps()
		const settles: (() => void)[] = []
		queryFetchSpy.mockImplementation(
			() =>
				new Promise<void>((resolve) => {
					settles.push(resolve)
				})
		)
		renderSubject(props)
		await user.click(screen.getByRole('button', { name: 'Pause' }))
		const refetchButton = screen.getByRole('button', { name: 'Refresh' })
		await user.click(refetchButton)
		await user.click(refetchButton)
		await vi.waitFor(() => {
			expect(screen.getByRole('status')).toHaveTextContent('Refreshing')
		})

		settles[0]?.()
		await new Promise((resolve) => setTimeout(resolve, FIRST_SETTLE_WAIT_MS))
		expect(screen.getByRole('status')).toHaveTextContent('Refreshing')

		settles[1]?.()
		await vi.waitFor(() => {
			expect(screen.getByRole('status')).toHaveTextContent('Refreshed')
		})
	})
})
