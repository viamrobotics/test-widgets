import type { Vector3 } from '@viamrobotics/sdk'
import type { ComponentProps } from 'svelte'

import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../SetVelocity.svelte'

describe('Base SetVelocity', () => {
	let user: ReturnType<typeof userEvent.setup>
	let setVelocity: (linear: Vector3, angular: Vector3) => void

	beforeEach(() => {
		user = userEvent.setup()
		setVelocity = vi.fn()
	})

	const replaceValue = async (input: HTMLElement, text: string) => {
		await user.clear(input)
		await user.type(input, text)
	}

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
		render(Subject, {
			setVelocity,
			...props,
		})

	it('calls setVelocity with the correct vectors when Execute button is clicked', async () => {
		renderSubject({})

		{
			const linVel = screen.getByRole('group', { name: /^linear/iu })
			const xInput = within(linVel).getByRole('spinbutton', { name: /^X/u })
			const yInput = within(linVel).getByRole('spinbutton', { name: /^Y/u })
			const zInput = within(linVel).getByRole('spinbutton', { name: /^Z/u })
			expect(xInput).toBeInTheDocument()
			expect(yInput).toBeInTheDocument()
			expect(zInput).toBeInTheDocument()
			await replaceValue(xInput, '10')
			await replaceValue(yInput, '20')
			await replaceValue(zInput, '30')
		}
		{
			const angVel = screen.getByRole('group', { name: /^angular/iu })
			const xInput = within(angVel).getByRole('spinbutton', { name: /^X/u })
			const yInput = within(angVel).getByRole('spinbutton', { name: /^Y/u })
			const zInput = within(angVel).getByRole('spinbutton', { name: /^Z/u })
			expect(xInput).toBeInTheDocument()
			expect(yInput).toBeInTheDocument()
			expect(zInput).toBeInTheDocument()
			await replaceValue(xInput, '5')
			await replaceValue(yInput, '10')
			await replaceValue(zInput, '15')
		}

		const executeButton = screen.getByRole('button', { name: /execute/iu })
		await user.click(executeButton)

		expect(setVelocity).toHaveBeenCalledWith({ x: 10, y: 20, z: 30 }, { x: 5, y: 10, z: 15 })
	})

	it('sends a negative value typed into a cleared axis', async () => {
		renderSubject({})
		const linear = screen.getByRole('group', { name: /^linear/iu })

		await replaceValue(within(linear).getByRole('spinbutton', { name: /^Y/u }), '-25')
		await user.click(screen.getByRole('button', { name: /execute/iu }))

		expect(setVelocity).toHaveBeenCalledWith({ x: 0, y: -25, z: 0 }, { x: 0, y: 0, z: 15 })
	})
})
