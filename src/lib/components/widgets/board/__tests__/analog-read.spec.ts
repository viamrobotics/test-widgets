import type { ComponentProps } from 'svelte'

import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../analog-read.svelte'

const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
	render(Subject, {
		value: undefined,
		getValue: vi.fn(),
		...props,
	})

describe('Board Analog Read', () => {
	let user: ReturnType<typeof userEvent.setup>
	let getValue: () => void

	beforeEach(() => {
		user = userEvent.setup()
		getValue = vi.fn()
	})

	it('calls getValue', async () => {
		renderSubject({
			getValue,
		})

		const valueSection = screen.getByRole('region', { name: 'Value' })
		const getValueButton = within(valueSection).getByRole('button', {
			name: /get/iu,
		})
		await user.click(getValueButton)

		expect(getValue).toHaveBeenCalled()
	})

	it('displays empty initial value', () => {
		renderSubject({})
		const valueSection = screen.getByRole('region', {
			name: /value/iu,
		})
		const valueOutput = within(valueSection).getByRole('status')
		expect(valueOutput).toBeInTheDocument()
		expect(valueOutput).toHaveTextContent(/––/iu)
	})

	it('displays value', () => {
		renderSubject({
			value: 50,
		})

		const valueSection = screen.getByRole('region', {
			name: /value/iu,
		})
		const valueOutput = within(valueSection).getByRole('status')
		expect(valueOutput).toBeInTheDocument()
		expect(valueOutput).toHaveTextContent('50')
	})
})
