import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'svelte';
import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

import Subject from '../quick-move.svelte';

describe('ArmView quick-move', () => {
	let user: ReturnType<typeof userEvent.setup>;

	beforeEach(() => {
		user = userEvent.setup();
	});

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
		render(Subject, {
			positions: [],
			moveToJointPositions: vi.fn(),
			lastError: null,
			...props
		});

	it('renders a row for each position', () => {
		renderSubject({
			positions: [1, 2, 3]
		});

		const rows = screen.getAllByRole('row');
		// 3 for positions, 1 for header
		expect(rows).toHaveLength(3 + 1);
	});

	it('calls quickMove with the correct parameters when minus button is clicked on row 0', async () => {
		const moveToJointPositions = vi.fn();
		renderSubject({
			positions: [1, 2],
			moveToJointPositions
		});

		const rows = screen.getAllByRole('row');
		expect(rows).toHaveLength(3);

		const axis0 = rows[1]!;

		const minusButton = within(axis0).getByRole('button', {
			name: 'minus-five-degrees'
		});
		expect(minusButton).toBeInTheDocument();
		await user.click(minusButton);

		expect(moveToJointPositions).toHaveBeenCalledWith([-4, 2]);
	});

	it('calls quickMove with the correct parameters when minus button is clicked on row 1', async () => {
		const moveToJointPositions = vi.fn();
		renderSubject({
			positions: [1, 2, 3],
			moveToJointPositions
		});

		const rows = screen.getAllByRole('row');
		expect(rows).toHaveLength(4);

		const axis1 = rows[2]!;

		const minusButton = within(axis1).getByRole('button', {
			name: 'minus-five-degrees'
		});
		expect(minusButton).toBeInTheDocument();
		await user.click(minusButton);

		expect(moveToJointPositions).toHaveBeenCalledWith([1, -3, 3]);
	});

	it('calls quickMove with the correct parameters when plus button is clicked', async () => {
		const moveToJointPositions = vi.fn();
		renderSubject({
			positions: [1],
			moveToJointPositions
		});

		const plusButton = screen.getByRole('button', {
			name: 'plus-five-degrees'
		});
		expect(plusButton).toBeInTheDocument();
		await user.click(plusButton);

		expect(moveToJointPositions).toHaveBeenCalledWith([6]);
	});

	it('displays the provided error', () => {
		renderSubject({ lastError: new Error('some error msg') });
		expect(screen.getByText(/some error msg/iu)).toBeInTheDocument();
	});
});
