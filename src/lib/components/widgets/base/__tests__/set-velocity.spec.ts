import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'svelte';
import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

import type { Vector3 } from '@viamrobotics/sdk';

import Subject from '../set-velocity.svelte';

describe('BaseView SetVelocity', () => {
	let user: ReturnType<typeof userEvent.setup>;
	let setVelocity: (linear: Vector3, angular: Vector3) => void;

	beforeEach(() => {
		user = userEvent.setup();
		setVelocity = vi.fn();
	});

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
		render(Subject, {
			setVelocity,
			...props
		});

	it('calls setVelocity with the correct vectors when Execute button is clicked', async () => {
		renderSubject({});

		{
			const linVel = screen.getByRole('region', { name: /linear velocity/iu });
			const xInput = within(linVel).getByRole('spinbutton', { name: /^X/u });
			const yInput = within(linVel).getByRole('spinbutton', { name: /^Y/u });
			const zInput = within(linVel).getByRole('spinbutton', { name: /^Z/u });
			expect(xInput).toBeInTheDocument();
			expect(yInput).toBeInTheDocument();
			expect(zInput).toBeInTheDocument();
			await user.clear(xInput);
			await user.type(xInput, '10');
			await user.clear(yInput);
			await user.type(yInput, '20');
			await user.clear(zInput);
			await user.type(zInput, '30');
		}
		{
			const angVel = screen.getByRole('region', { name: /angular velocity/iu });
			const xInput = within(angVel).getByRole('spinbutton', { name: /^X/u });
			const yInput = within(angVel).getByRole('spinbutton', { name: /^Y/u });
			const zInput = within(angVel).getByRole('spinbutton', { name: /^Z/u });
			expect(xInput).toBeInTheDocument();
			expect(yInput).toBeInTheDocument();
			expect(zInput).toBeInTheDocument();
			await user.clear(xInput);
			await user.type(xInput, '5');
			await user.clear(yInput);
			await user.type(yInput, '10');
			await user.clear(zInput);
			await user.type(zInput, '15');
		}

		const executeButton = screen.getByRole('button', { name: /execute/iu });
		await user.click(executeButton);

		expect(setVelocity).toHaveBeenCalledWith({ x: 10, y: 20, z: 30 }, { x: 5, y: 10, z: 15 });
	});
});
