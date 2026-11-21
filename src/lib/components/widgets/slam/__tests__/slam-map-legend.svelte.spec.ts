import '../../../../../app.css'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import SlamMap2D from '$lib/components/slam/map2d/index.svelte'

const renderMap = (legendOpen?: boolean) =>
	render(SlamMap2D, { props: { onClick: () => {}, legendOpen } })

describe('SlamMap2D legend', () => {
	it('starts open when no starting state is given', () => {
		renderMap()

		expect(screen.getByRole('button', { name: 'Legend' })).toHaveAttribute('aria-expanded', 'true')
	})

	it('starts collapsed when legendOpen is false', () => {
		renderMap(false)

		expect(screen.getByRole('button', { name: 'Legend' })).toHaveAttribute('aria-expanded', 'false')
	})

	it('lets the person open a collapsed legend', async () => {
		const user = userEvent.setup()
		renderMap(false)

		await user.click(screen.getByRole('button', { name: 'Legend' }))

		expect(screen.getByRole('button', { name: 'Legend' })).toHaveAttribute('aria-expanded', 'true')
	})
})
