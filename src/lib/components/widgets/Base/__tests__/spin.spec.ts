import type { ComponentProps } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../spin.svelte'

describe('Base Spin', () => {
	let user: ReturnType<typeof userEvent.setup>
	let spin: (angleDeg: number, degsPerSec: number) => void

	beforeEach(() => {
		user = userEvent.setup()
		spin = vi.fn()
	})

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
		render(Subject, {
			spin,
			...props,
		})

	it('calls spin with the correct default values when Execute button is clicked', async () => {
		renderSubject({})

		const executeButton = screen.getByRole('button', { name: /execute/iu })
		await user.click(executeButton)

		expect(spin).toHaveBeenCalledWith(90, 45)
	})

	it('calls spin with the correct angleDeg and degsPerSec values when Execute button is clicked', async () => {
		renderSubject({})

		const angleInput = screen.getByRole('spinbutton', {
			name: /^angle/iu,
		})
		await user.clear(angleInput)
		await user.type(angleInput, '180')

		const angularVelocityInput = screen.getByRole('spinbutton', {
			name: /^angular velocity/iu,
		})
		await user.clear(angularVelocityInput)
		await user.type(angularVelocityInput, '-60')

		const executeButton = screen.getByRole('button', { name: /execute/iu })
		await user.click(executeButton)

		expect(spin).toHaveBeenCalledWith(180, -60)
	})
})
