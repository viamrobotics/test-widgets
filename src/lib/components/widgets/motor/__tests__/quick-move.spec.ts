import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

import Subject from '../quick-move.svelte';

describe('MotorView QuickMove', () => {
	let user: ReturnType<typeof userEvent.setup>;
	let setPower: (power: number) => void;

	beforeEach(() => {
		user = userEvent.setup();
		setPower = vi.fn();
	});

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
		render(Subject, {
			setPower,
			...props
		});

	it('calls setPower with positive value on forward button mousedown', async () => {
		renderSubject({});

		// This presses the forward button without releasing it.
		const forwardButton = screen.getByRole('button', { name: /forward/iu });
		await user.pointer({ target: forwardButton, keys: '[MouseLeft>]' });

		expect(setPower).toHaveBeenCalledWith(0.5);
		expect(setPower).not.toHaveBeenCalledWith(0);
	});

	it('calls setPower with negative value on backward button mousedown', async () => {
		renderSubject({});

		const backwardButton = screen.getByRole('button', { name: /backward/iu });
		await user.pointer({ target: backwardButton, keys: '[MouseLeft>]' });

		expect(setPower).toHaveBeenCalledWith(-0.5);
	});

	it('calls setPower with zero on button mouseup', async () => {
		renderSubject({});

		const forwardButton = screen.getByRole('button', { name: /forward/iu });
		await user.click(forwardButton);

		expect(setPower).toHaveBeenCalledWith(0.5);
		expect(setPower).toHaveBeenCalledWith(0);
	});
});
