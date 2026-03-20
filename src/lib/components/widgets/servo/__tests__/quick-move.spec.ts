import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

import Subject from '../quick-move.svelte';

describe('ServoView Quick move', () => {
	let user: ReturnType<typeof userEvent.setup>;
	let moveTo: (angle: number) => void;

	beforeEach(() => {
		user = userEvent.setup();
		moveTo = vi.fn();
	});

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
		render(Subject, {
			currentPosition: 0,
			moveTo,
			lastError: null,
			...props
		});

	it('calls moveTo with the current position minus 5 when minus button is clicked', async () => {
		const currentPosition = 10;
		renderSubject({ currentPosition });

		const minusButton = screen.getByRole('button', {
			name: /minus-five-degrees/iu
		});
		await user.click(minusButton);

		expect(moveTo).toHaveBeenCalledWith(currentPosition - 5);
	});

	it('calls moveTo with the current position plus 5 when plus button is clicked', async () => {
		const currentPosition = 10;
		renderSubject({ currentPosition });

		const plusButton = screen.getByRole('button', {
			name: /plus-five-degrees/iu
		});
		await user.click(plusButton);

		expect(moveTo).toHaveBeenCalledWith(currentPosition + 5);
	});

	it('disables minus 5 when the current position is less than 5', () => {
		renderSubject({ currentPosition: 4 });

		const minusButton = screen.getByRole('button', {
			name: /minus-five-degrees/iu
		});
		expect(minusButton).toHaveAttribute('aria-disabled', 'true');
	});

	it('displays the provided error', () => {
		renderSubject({ lastError: new Error('some error msg') });
		expect(screen.getByText(/some error msg/iu)).toBeInTheDocument();
	});
});
