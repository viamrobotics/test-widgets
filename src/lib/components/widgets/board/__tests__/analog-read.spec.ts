import type { ComponentProps } from 'svelte'

import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import Subject from '../analog-read.svelte'

const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
	render(Subject, {
		value: undefined,
		getValue: vi.fn(async () => true),
		...props,
	})

const valueRow = () => within(screen.getByRole('group', { name: 'Value' }))

describe('Board Analog Read', () => {
	it('calls getValue from the Value row', async () => {
		const user = userEvent.setup()
		const getValue = vi.fn(async () => true)
		renderSubject({ getValue })

		await user.click(valueRow().getByRole('button', { name: 'Get' }))

		expect(getValue).toHaveBeenCalledOnce()
	})

	it('reads - before a read', () => {
		renderSubject({})

		expect(valueRow().getByRole('status')).toHaveTextContent('-')
	})

	it('reads the value', () => {
		renderSubject({ value: 50 })

		expect(valueRow().getByRole('status')).toHaveTextContent('50')
	})
})
