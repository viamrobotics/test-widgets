import { beforeEach, describe, expect, it } from 'vitest';
import type { ComponentProps } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

import { emptyPosition, position } from '../__fixtures__/position.ts';
import Subject from '../position.svelte';

describe('SlamView position', () => {
	let user: ReturnType<typeof userEvent.setup>;

	beforeEach(() => {
		user = userEvent.setup();
	});

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
		render(Subject, {
			position,
			...props
		});

	it('renders the position', () => {
		renderSubject({});

		const terms = screen.getAllByRole('term');
		const defs = screen.getAllByRole('definition');

		expect(terms).toHaveLength(7);
		expect(defs).toHaveLength(7);

		// Pose position is displayed in meters, not millimeters
		expect(defs[0]).toHaveTextContent('1.2');
		expect(defs[1]).toHaveTextContent('2.3');
		// 3.456 is rounded to 3.5
		expect(defs[2]).toHaveTextContent('3.5');
	});

	it('renders empty position', () => {
		renderSubject({ position: emptyPosition });

		const defs = screen.getAllByRole('definition');

		expect(defs).toHaveLength(7);

		expect(defs[0]).toHaveTextContent('–');
	});

	it('copies position', async () => {
		renderSubject({});

		const copyButton = screen.getByRole('button', { name: /copy/iu });

		expect(await window.navigator.clipboard.readText()).toBe('');
		await user.click(copyButton);
		expect(await window.navigator.clipboard.readText()).not.toBe('');
	});
});
