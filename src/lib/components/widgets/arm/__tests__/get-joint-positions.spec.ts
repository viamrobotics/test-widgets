import type { ComponentProps } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import Subject from '../get-joint-positions.svelte'

describe('Arm get-joint-positions', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
	})

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
		render(Subject, {
			positions: [],
			...props,
		})

	it('renders a row for each position', () => {
		renderSubject({ positions: [10, 20, 30] })

		const rows = screen.getAllByRole('row')
		// 3 data rows + 1 header row
		expect(rows).toHaveLength(4)
	})

	it('displays degree symbol as unit by default', () => {
		renderSubject({ positions: [10] })

		expect(screen.getByText('°')).toBeInTheDocument()
	})

	it('displays rad unit when toggled to radians', async () => {
		renderSubject({ positions: [10] })

		const toggle = screen.getByRole('button', { name: /radians/iu })
		await user.click(toggle)

		expect(screen.getByText('rad')).toBeInTheDocument()
	})

	it('displays a unit abbreviation for each position value', () => {
		renderSubject({ positions: [10, 20, 30] })

		const degreeSymbols = screen.getAllByText('°')
		expect(degreeSymbols).toHaveLength(3)
	})
})
