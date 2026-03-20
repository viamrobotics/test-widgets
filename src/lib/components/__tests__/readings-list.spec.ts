import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';

import Subject from '../readings-list.svelte';

describe('<ReadingsList>', () => {
	it('renders a list of readings', () => {
		const data = {
			gizmos: 8,
			whizzbangs: { enabled: true }
		};

		render(Subject, { data });
		expect(screen.getByRole('term', { name: 'gizmos' })).toBeInTheDocument();
		expect(screen.getByText('8')).toBeInTheDocument();
		expect(screen.getByRole('term', { name: 'whizzbangs' })).toBeInTheDocument();
		expect(screen.getByText(/"enabled": true/iu)).toBeInTheDocument();
	});

	it('sorts nested readings', () => {
		const data = {
			b: 8,
			a: { b: '2', '1': '0', a: '1' }
		};

		render(Subject, { data });
		// note: sorted alphanumerically
		const nestedObj = screen.getByText(/\s*"1": "0",\s*"a": "1",\s*"b": "2"/iu);
		const terms = screen.getAllByRole('term');

		expect(terms).toHaveLength(2);
		expect(terms[0]).toHaveTextContent('a');
		expect(terms[1]).toHaveTextContent('b');
		expect(nestedObj).toBeInTheDocument();
	});

	it('renders nested image', () => {
		const data = {
			image:
				'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII='
		};

		render(Subject, { data });
		const image = screen.getByRole('img');
		expect(image).toBeInTheDocument();
		expect(image).toHaveAttribute('src', data.image);
		expect(image).toHaveAttribute('alt', 'image');
	});
});
