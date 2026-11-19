import type { ComponentProps } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { emptyPosition, position } from '../__fixtures__/position.ts'
import Subject from '../position.svelte'

describe('Slam position', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
	})

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
		render(Subject, {
			position,
			...props,
		})

	it('renders the position', () => {
		renderSubject({})

		const terms = screen.getAllByRole('term')
		const defs = screen.getAllByRole('definition')

		expect(terms).toHaveLength(7)
		expect(defs).toHaveLength(7)

		// Pose position is displayed in meters, not millimeters
		expect(defs[0]).toMatchTextContent('1.2')
		expect(defs[1]).toMatchTextContent('2.3')
		// 3.456 is rounded to 3.5
		expect(defs[2]).toMatchTextContent('3.5')
	})

	it('applies units: m on position, none on orientation, ° on theta', () => {
		renderSubject({})

		const defs = screen.getAllByRole('definition')

		expect(defs[0]).toMatchTextContent('m')
		expect(defs[2]).toMatchTextContent('m')
		expect(defs[3]).not.toMatchTextContent(/[a-z°]/iu)
		expect(defs[5]).not.toMatchTextContent(/[a-z°]/iu)
		expect(defs[6]).toMatchTextContent('°')
	})

	it('renders empty position', () => {
		renderSubject({ position: emptyPosition })

		const defs = screen.getAllByRole('definition')

		expect(defs).toHaveLength(7)

		expect(defs[0]).toMatchTextContent('–')
	})

	it('copies position', async () => {
		renderSubject({})

		const copyButton = screen.getByRole('button', { name: /copy/iu })

		expect(await globalThis.navigator.clipboard.readText()).toBe('')
		await user.click(copyButton)
		expect(await globalThis.navigator.clipboard.readText()).not.toBe('')
	})
})
