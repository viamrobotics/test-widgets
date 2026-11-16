import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../position.svelte'

describe('Switch position', () => {
	it('calls onSelect with a picked position', async () => {
		const onSelect = vi.fn()
		render(Subject, {
			props: { numPositions: 3, labels: ['Off', 'On', 'Auto'], currentPosition: 1, onSelect },
		})

		await userEvent.click(screen.getByRole('button', { name: 'Auto' }))

		expect(onSelect).toHaveBeenCalledWith(2)
	})
})
