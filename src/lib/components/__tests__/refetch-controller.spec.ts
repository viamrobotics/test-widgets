import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'svelte';
import { get, writable } from 'svelte/store';
import type { QueryObserverResult } from '@tanstack/svelte-query';
import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

import { RefetchIntervals, RefetchRates } from '../refetch-controller';
import Subject from '../refetch-controller.svelte';

const renderSubject = (props: ComponentProps<typeof Subject>) => {
	return render(Subject, props);
};

const createSubjectProps = () => {
	const refetchInterval = writable(1000);

	const queryFetchSpy = vi.fn();
	const mockQuery: QueryObserverResult = {
		data: 'Success',
		error: null,
		isError: false,
		isLoading: false,
		isPending: false,
		isSuccess: true,
		status: 'success',
		refetch: queryFetchSpy.mockResolvedValue({ data: 'Success' })
	} as unknown as QueryObserverResult;

	return {
		props: { queries: [mockQuery], refetchInterval },
		queryFetchSpy
	};
};

describe('<RefetchController>', () => {
	let user: ReturnType<typeof userEvent.setup>;

	beforeEach(() => {
		user = userEvent.setup();
	});

	it('stops refetching when pause is clicked', async () => {
		const { props } = createSubjectProps();
		renderSubject(props);

		const pauseButton = screen.getByRole('button', { name: /pause/iu });
		await user.click(pauseButton);
		expect(get(props.refetchInterval)).toBe(false);
	});

	it('updates refetchInterval when an option is selected', async () => {
		const { props } = createSubjectProps();
		renderSubject({ ...props, allowLive: true });

		const select = screen.getByRole('combobox');
		const options = within(select).getAllByRole('option');

		expect(options[0]).toHaveAccessibleName(RefetchRates.LIVE);
		expect(options[1]).toHaveAccessibleName(RefetchRates.ONE_SEC);
		expect(options[2]).toHaveAccessibleName(RefetchRates.FIVE_SEC);
		expect(options[3]).toHaveAccessibleName(RefetchRates.MANUAL);

		await user.selectOptions(select, RefetchRates.MANUAL);
		expect(get(props.refetchInterval)).toBe(RefetchIntervals.MANUAL);
		await user.selectOptions(select, RefetchRates.ONE_SEC);
		expect(get(props.refetchInterval)).toBe(RefetchIntervals.ONE_SEC);
		await user.selectOptions(select, RefetchRates.FIVE_SEC);
		expect(get(props.refetchInterval)).toBe(RefetchIntervals.FIVE_SEC);
		await user.selectOptions(select, RefetchRates.LIVE);
		expect(get(props.refetchInterval)).toBe(RefetchIntervals.LIVE);
	});

	it('does not render a live option unless allowLive is set', () => {
		const { props } = createSubjectProps();
		renderSubject(props);
		expect(screen.queryByText(RefetchRates.LIVE)).not.toBeInTheDocument();
	});

	it('refetches the query when the manual refetch button is pressed', async () => {
		const { props, queryFetchSpy } = createSubjectProps();
		renderSubject(props);

		const pauseButton = screen.getByRole('button', { name: /pause/iu });
		await user.click(pauseButton);
		const refetchButton = screen.getByRole('button', { name: /refetch/iu });
		const refreshIcon = screen.getByTestId('icon-refresh');
		expect(refreshIcon).toBeInTheDocument();
		await user.click(refetchButton);
		await user.click(refetchButton);
		await user.click(refetchButton);
		expect(queryFetchSpy).toHaveBeenNthCalledWith(3);
	});
});
