import { describe, expect, it } from 'vitest';
import type { ComponentProps } from 'svelte';
import { render, screen } from '@testing-library/svelte';

import Subject from '../card-list.svelte';

describe('CardList', () => {
	const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
		render(Subject, {
			partID: 'part-id',
			urlHash: '',
			isLoading: false,
			error: undefined,
			resources: [],
			...props
		});

	it('shows loading state', () => {
		renderSubject({
			isLoading: true
		});

		const cameraLink = screen.queryByRole('link', { name: /fake-camera/iu });
		const loadingIndicator = screen.getByRole('progressbar');

		expect(cameraLink).not.toBeInTheDocument();
		expect(loadingIndicator).toBeInTheDocument();
	});

	it('shows an error', () => {
		renderSubject({
			error: new Error('uh oh spaghettios')
		});

		const error = screen.getByText(/uh oh spaghettios/iu);

		expect(error).toBeInTheDocument();
	});

	it('shows null state', () => {
		renderSubject({
			resources: []
		});

		const noResourcesText = screen.getByText(/no resources/iu);
		const link = screen.getByRole('link');

		expect(noResourcesText).toBeInTheDocument();
		expect(link).toBeInTheDocument();
	});
});
