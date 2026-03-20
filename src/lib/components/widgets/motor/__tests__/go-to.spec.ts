import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

import Subject from '../go-to.svelte';

describe('MotorView GoTo', () => {
	let user: ReturnType<typeof userEvent.setup>;
	let goTo: (rpm: number, pos: number) => void;

	beforeEach(() => {
		user = userEvent.setup();
		goTo = vi.fn();
	});

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
		render(Subject, {
			goTo,
			...props
		});

	it('calls goTo with the correct rpm and pos values when Execute button is clicked', async () => {
		renderSubject({});

		const revolutionsInput = screen.getByRole('spinbutton', {
			name: /^target position/iu
		});
		await user.clear(revolutionsInput);
		await user.type(revolutionsInput, '-10');

		const rpmInput = screen.getByRole('spinbutton', { name: /^rpm/iu });
		await user.clear(rpmInput);
		await user.type(rpmInput, '1001');

		const executeButton = screen.getByRole('button', { name: /execute/iu });
		await user.click(executeButton);

		expect(goTo).toHaveBeenCalledWith(1001, -10);
	});
});
