import { fireEvent, render } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'

import Subject from '../obstacles-overlay.svelte'
import { obstacles } from './__fixtures__/obstacles.ts'

describe('NavigationService obstacles overlay', () => {
	const renderSubject = () => {
		const { baseElement } = render(Subject, {
			obstacles,
			hovered: null,
			onEnter: vi.fn(),
			onLeave: vi.fn(),
		})

		return page.elementLocator(baseElement)
	}

	it('starts collapsed, with the obstacle list hidden', async () => {
		const screen = renderSubject()

		await expect
			.element(screen.getByRole('button', { name: 'Obstacles' }))
			.toHaveAttribute('aria-expanded', 'false')
		await expect.element(screen.getByRole('list', { name: 'Obstacles' })).not.toBeInTheDocument()
	})

	it('shows the obstacle list when its Obstacles header is pressed', async () => {
		const screen = renderSubject()
		const toggle = screen.getByRole('button', { name: 'Obstacles' })

		await fireEvent.click(toggle.element())

		await expect.element(toggle).toHaveAttribute('aria-expanded', 'true')
		await expect.element(screen.getByRole('list', { name: 'Obstacles' })).toBeVisible()
	})
})
