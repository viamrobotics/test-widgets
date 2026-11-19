import type { Vector3Tuple } from 'three'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../inputs.svelte'

describe('<Inputs>', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
	})

	it('renders pointcloud control inputs', () => {
		const pointSize = 0.02
		const up: Vector3Tuple = [0, 0, 1]

		render(Subject, {
			up,
			pointSize,
			onPointSizeChange: vi.fn(),
			onUpChange: vi.fn(),
		})

		expect(screen.getByRole('spinbutton', { name: /point size/iu })).toHaveValue(pointSize)
		expect(screen.getByRole('combobox', { name: /camera up vector/iu })).toHaveTextContent('+z')
	})

	it('calls update callbacks with the correct values when inputs are modified', async () => {
		const up: Vector3Tuple = [0, 0, 1]
		const pointSize = 0.02

		const onPointSizeChange = vi.fn()
		const onUpChange = vi.fn()

		render(Subject, {
			up,
			pointSize,
			onPointSizeChange,
			onUpChange,
		})

		const sizeInput = screen.getByRole('spinbutton', { name: /point size/iu })
		await user.clear(sizeInput)
		await user.type(sizeInput, '1')
		await user.tab()

		await user.click(screen.getByRole('combobox', { name: /camera up vector/iu }))
		await user.click(await screen.findByRole('option', { name: '-y' }))

		expect(onPointSizeChange).toHaveBeenLastCalledWith(1)
		expect(onUpChange).toHaveBeenCalledOnce()
		expect(onUpChange).toHaveBeenCalledWith([0, -1, 0])
	})
})
