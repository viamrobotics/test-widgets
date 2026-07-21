import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../frame-select.svelte'

const options = ['my-arm', 'my-gripper']

describe('Motion frame select', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
	})

	it('renders a placeholder plus an option per frame', () => {
		render(Subject, { value: '', options, label: 'Component', onChange: vi.fn() })

		expect(screen.getByRole('option', { name: /select a frame/iu })).toBeInTheDocument()
		expect(screen.getByRole('option', { name: 'my-arm' })).toBeInTheDocument()
		expect(screen.getByRole('option', { name: 'my-gripper' })).toBeInTheDocument()
	})

	it('emits the selected frame name', async () => {
		const onChange = vi.fn()
		render(Subject, { value: '', options, label: 'Component', onChange })

		await user.selectOptions(screen.getByRole('combobox'), 'my-gripper')

		expect(onChange).toHaveBeenCalledWith('my-gripper')
	})

	it('reflects the current value as selected', () => {
		render(Subject, { value: 'my-arm', options, label: 'Component', onChange: vi.fn() })

		expect(screen.getByRole('combobox')).toHaveValue('my-arm')
	})
})
