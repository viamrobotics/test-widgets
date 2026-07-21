import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../component-name-select.svelte'

const options = ['my-arm', 'my-gripper']

describe('Motion component-name select', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
	})

	it('renders a placeholder plus an option per resource', () => {
		render(Subject, { value: '', options, onChange: vi.fn() })

		expect(screen.getByRole('option', { name: /select a component/iu })).toBeInTheDocument()
		expect(screen.getByRole('option', { name: 'my-arm' })).toBeInTheDocument()
		expect(screen.getByRole('option', { name: 'my-gripper' })).toBeInTheDocument()
	})

	it('emits the selected component name', async () => {
		const onChange = vi.fn()
		render(Subject, { value: '', options, onChange })

		await user.selectOptions(screen.getByRole('combobox'), 'my-gripper')

		expect(onChange).toHaveBeenCalledWith('my-gripper')
	})

	it('reflects the current value as selected', () => {
		render(Subject, { value: 'my-arm', options, onChange: vi.fn() })

		expect(screen.getByRole('combobox')).toHaveValue('my-arm')
	})
})
