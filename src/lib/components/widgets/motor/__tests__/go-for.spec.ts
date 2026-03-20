import type { ComponentProps } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../go-for.svelte'

describe('MotorView GoFor', () => {
	let user: ReturnType<typeof userEvent.setup>
	let goFor: (rpm: number, revolutions: number) => void

	beforeEach(() => {
		user = userEvent.setup()
		goFor = vi.fn()
	})

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
		render(Subject, {
			goFor,
			...props,
		})

	it('calls goFor with the correct rpm and revolutions values when Execute button is clicked', async () => {
		renderSubject({})

		const revolutionsInput = screen.getByRole('spinbutton', {
			name: /^revolutions/iu,
		})
		await user.clear(revolutionsInput)
		await user.type(revolutionsInput, '10')

		const rpmInput = screen.getByRole('spinbutton', { name: /^rpm/iu })
		await user.clear(rpmInput)
		await user.type(rpmInput, '100')

		const executeButton = screen.getByRole('button', { name: /execute/iu })
		await user.click(executeButton)

		expect(goFor).toHaveBeenCalledWith(100, 10)
	})
})
