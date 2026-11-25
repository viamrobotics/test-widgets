import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { createRawSnippet } from 'svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../frame-select.svelte'

const options = ['my-arm', 'my-gripper']

const componentLabel = createRawSnippet(() => ({ render: () => '<span>Component</span>' }))

describe('Motion frame select', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
	})

	it('is named by its label', () => {
		render(Subject, { value: 'my-arm', options, label: componentLabel, onChange: vi.fn() })

		expect(screen.getByRole('combobox', { name: 'Component' })).toBeInTheDocument()
	})

	it('reads "Select a frame…" while no frame is chosen', () => {
		render(Subject, { value: '', options, label: componentLabel, onChange: vi.fn() })

		expect(screen.getByRole('combobox', { name: 'Component' })).toHaveTextContent('Select a frame…')
	})

	it('lists an option per frame', async () => {
		render(Subject, { value: '', options, label: componentLabel, onChange: vi.fn() })

		await user.click(screen.getByRole('combobox', { name: 'Component' }))

		expect(await screen.findAllByRole('option')).toHaveLength(2)
		expect(screen.getByRole('option', { name: 'my-arm' })).toBeInTheDocument()
		expect(screen.getByRole('option', { name: 'my-gripper' })).toBeInTheDocument()
	})

	it('emits the selected frame name', async () => {
		const onChange = vi.fn()
		render(Subject, { value: '', options, label: componentLabel, onChange })

		await user.click(screen.getByRole('combobox', { name: 'Component' }))
		await user.click(await screen.findByRole('option', { name: 'my-gripper' }))

		expect(onChange).toHaveBeenCalledWith('my-gripper')
	})

	it('shows the current value', () => {
		render(Subject, { value: 'my-arm', options, label: componentLabel, onChange: vi.fn() })

		expect(screen.getByRole('combobox', { name: 'Component' })).toHaveTextContent('my-arm')
	})
})
