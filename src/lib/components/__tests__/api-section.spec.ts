import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'

import Subject from './api-section-error.spec.svelte'

describe('<ApiSection>', () => {
	it('contains a render error to its own section so sibling sections still render', () => {
		render(Subject)

		expect(screen.getByRole('heading', { name: 'Broken' })).toBeInTheDocument()
		expect(screen.getByText(/something went wrong/iu)).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: 'Healthy' })).toBeInTheDocument()
		expect(screen.getByText('still standing')).toBeInTheDocument()
	})
})
