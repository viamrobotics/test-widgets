import type { Vector3 } from '@viamrobotics/sdk'
import type { ComponentProps } from 'svelte'

import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../set-power.svelte'

describe('BaseView SetPower', () => {
	let user: ReturnType<typeof userEvent.setup>
	let setPower: (linear: Vector3, angular: Vector3) => void

	beforeEach(() => {
		user = userEvent.setup()
		setPower = vi.fn()
	})

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
		render(Subject, {
			setPower,
			...props,
		})

	it('calls setPower with the correct vectors when Execute button is clicked', async () => {
		renderSubject({})

		{
			const linPower = screen.getByRole('region', { name: /linear power/iu })
			const xInput = within(linPower).getByRole('spinbutton', { name: /^X/u })
			const yInput = within(linPower).getByRole('spinbutton', { name: /^Y/u })
			const zInput = within(linPower).getByRole('spinbutton', { name: /^Z/u })
			expect(xInput).toBeInTheDocument()
			expect(yInput).toBeInTheDocument()
			expect(zInput).toBeInTheDocument()
			await user.clear(xInput)
			await user.type(xInput, '0.3')
			await user.clear(yInput)
			await user.type(yInput, '0.2')
			await user.clear(zInput)
			await user.type(zInput, '0.1')
		}
		{
			const angPower = screen.getByRole('region', { name: /angular power/iu })
			const xInput = within(angPower).getByRole('spinbutton', { name: /^X/u })
			const yInput = within(angPower).getByRole('spinbutton', { name: /^Y/u })
			const zInput = within(angPower).getByRole('spinbutton', { name: /^Z/u })
			expect(xInput).toBeInTheDocument()
			expect(yInput).toBeInTheDocument()
			expect(zInput).toBeInTheDocument()
			await user.clear(xInput)
			await user.type(xInput, '0.4')
			await user.clear(yInput)
			await user.type(yInput, '-0.5')
			await user.clear(zInput)
			await user.type(zInput, '1')
		}

		const executeButton = screen.getByRole('button', { name: /execute/iu })
		await user.click(executeButton)

		expect(setPower).toHaveBeenCalledWith({ x: 0.3, y: 0.2, z: 0.1 }, { x: 0.4, y: -0.5, z: 1 })
	})
})
