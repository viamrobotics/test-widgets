import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import Subject from '../extra-params-input.svelte'
import { type ExtraParamsStore } from '../extra-params-store.svelte'
import { parseExtraParams } from '../parse-extra-params'

// A plain (non-persisted) stand-in for the store, so these tests exercise the
// component's rendering rather than localStorage behavior.
const createStubStore = (initialText = ''): ExtraParamsStore => {
	let text = initialText
	return {
		get text() {
			return text
		},
		set text(value: string) {
			text = value
		},
		get current() {
			return parseExtraParams(text).params
		},
		get error() {
			return parseExtraParams(text).error
		},
	}
}

describe('<ExtraParamsInput>', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
	})

	it('starts collapsed when there are no saved params', () => {
		render(Subject, { store: createStubStore() })

		expect(screen.getByRole('button', { name: /additional parameters/iu })).toHaveAttribute(
			'aria-expanded',
			'false'
		)
	})

	it('starts expanded when saved params exist', () => {
		render(Subject, { store: createStubStore('{"quality": 75}') })

		expect(screen.getByRole('button', { name: /additional parameters/iu })).toHaveAttribute(
			'aria-expanded',
			'true'
		)
	})

	it('expands to reveal the editor when the trigger is clicked', async () => {
		render(Subject, { store: createStubStore() })

		const trigger = screen.getByRole('button', { name: /additional parameters/iu })
		await user.click(trigger)

		expect(trigger).toHaveAttribute('aria-expanded', 'true')
		expect(screen.getByLabelText('extra')).toBeInTheDocument()
	})

	it('surfaces a parse error for invalid JSON', () => {
		render(Subject, { store: createStubStore('{"quality": ') })

		expect(screen.getByText(/SyntaxError/iu)).toBeInTheDocument()
	})

	it('shows no error for valid JSON', () => {
		render(Subject, { store: createStubStore('{"quality": 75}') })

		expect(screen.queryByText(/SyntaxError/iu)).not.toBeInTheDocument()
	})
})
