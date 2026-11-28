import type { ComponentProps } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { emptyPosition, position } from '../__fixtures__/position.ts'
import Subject from '../Position.svelte'

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

		// The position is shown in millimeters, as the method returns it.
		expect(defs[0]).toMatchTextContent('1234')
		expect(defs[1]).toMatchTextContent('2345')
		expect(defs[2]).toMatchTextContent('3456')
	})

	it('applies units: mm on position, none on orientation, ° on theta', () => {
		renderSubject({})

		const defs = screen.getAllByRole('definition')

		expect(defs[0]).toMatchTextContent('mm')
		expect(defs[2]).toMatchTextContent('mm')
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

	it('holds Copy back with a reason and writes nothing while there is no pose', async () => {
		renderSubject({ position: emptyPosition })

		const copyButton = screen.getByRole('button', { name: /copy/iu })

		expect(copyButton).toHaveAttribute('aria-disabled', 'true')
		expect(copyButton).not.toHaveAttribute('disabled')
		expect(copyButton).toHaveAccessibleDescription('There is no pose to copy.')

		await globalThis.navigator.clipboard.writeText('')
		await user.click(copyButton)

		expect(await globalThis.navigator.clipboard.readText()).toBe('')
	})

	it('copies position', async () => {
		renderSubject({})

		const copyButton = screen.getByRole('button', { name: /copy/iu })

		expect(await globalThis.navigator.clipboard.readText()).toBe('')
		await user.click(copyButton)

		// The copy is the pose the method returned, with nothing converted.
		expect(JSON.parse(await globalThis.navigator.clipboard.readText())).toEqual({
			x: 1234,
			y: 2345,
			z: 3456,
			oX: 4,
			oY: 5,
			oZ: 6,
			theta: 7,
		})
	})
})
