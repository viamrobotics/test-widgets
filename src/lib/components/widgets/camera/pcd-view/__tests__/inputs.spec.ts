import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import type { Vector3Tuple } from 'three';

import Subject from '../inputs.svelte';

describe('<Inputs>', () => {
	let user: ReturnType<typeof userEvent.setup>;

	beforeEach(() => {
		user = userEvent.setup();
	});

	it('renders pointcloud control inputs', () => {
		const pointSize = 0.02;
		const up: Vector3Tuple = [0, 0, 1];

		render(Subject, {
			up,
			pointSize,
			data: new Uint8Array(),
			onPointSizeChange: vi.fn(),
			onUpChange: vi.fn()
		});

		const sizeInput = screen.getByLabelText<HTMLInputElement>(/point size/iu);
		expect(sizeInput.valueAsNumber).toBe(pointSize);

		const upInput = screen.getByLabelText<HTMLInputElement>(/camera up vector/iu);
		expect(upInput.value).toBe(up.toString());
	});

	it('calls update callbacks with the correct values when inputs are modified', async () => {
		const up: Vector3Tuple = [0, 0, 1];
		const pointSize = 0.02;

		const onPointSizeChange = vi.fn();
		const onUpChange = vi.fn();

		render(Subject, {
			up,
			pointSize,
			data: new Uint8Array(),
			onPointSizeChange,
			onUpChange
		});

		const sizeInput = screen.getByLabelText<HTMLInputElement>(/point size/iu);
		await user.clear(sizeInput);
		await user.type(sizeInput, '1');
		expect(sizeInput.value).toBe('1');

		const upInput = screen.getByLabelText<HTMLInputElement>(/camera up vector/iu);
		const option = screen.getByRole<HTMLOptionElement>('option', {
			name: /-y/iu
		});
		await user.click(upInput);
		await user.selectOptions(upInput, option);

		expect(upInput).toHaveValue('0,-1,0');
		expect(option.selected).toBe(true);

		expect(onPointSizeChange).toHaveBeenCalledOnce();
		expect(onUpChange).toHaveBeenCalledOnce();

		expect(onPointSizeChange).toHaveBeenCalledWith(1);
		expect(onUpChange).toHaveBeenCalledWith([0, -1, 0]);
	});
});
