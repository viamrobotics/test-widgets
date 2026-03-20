import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

import Subject from '../analog-write.svelte';

const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
	render(Subject, {
		setValue: vi.fn(),
		...props
	});

describe('BoardView Analog Write', () => {
	let user: ReturnType<typeof userEvent.setup>;
	let setValue: () => void;

	beforeEach(() => {
		user = userEvent.setup();
		setValue = vi.fn();
	});

	it('calls setValue', async () => {
		renderSubject({ setValue });

		const valueInput = screen.getByRole('spinbutton', {
			name: /value/iu
		});
		await user.clear(valueInput);
		await user.type(valueInput, '129');
		const setValueButton = screen.getByRole('button', {
			name: /set/iu
		});
		await user.click(setValueButton);

		expect(setValue).toHaveBeenCalledWith(129);
	});

	it('displays empty initial value', () => {
		renderSubject({});

		const valueInput = screen.getByRole('spinbutton', {
			name: /value/iu
		});
		expect(valueInput).toHaveValue(0);
	});
});
