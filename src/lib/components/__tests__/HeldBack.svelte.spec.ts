import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'

import Host from './__fixtures__/HeldBackHost.svelte'

const REASON = 'Enter a pin.'

const button = () => screen.getByRole('button', { name: 'Execute' })

describe('HeldBack', () => {
	it('leaves the button enabled and undescribed with no reason', () => {
		render(Host, { reason: undefined })

		expect(button()).toBeEnabled()
		expect(button()).not.toHaveAttribute('aria-describedby')
	})

	it('reads the button as disabled without the disabled attribute, so it keeps focus', () => {
		render(Host, { reason: REASON })

		button().focus()

		expect(button()).toHaveAttribute('aria-disabled', 'true')
		expect(button()).not.toHaveAttribute('disabled')
		expect(button()).toHaveFocus()
	})

	it('describes the button with the reason', () => {
		render(Host, { reason: REASON })

		expect(button()).toHaveAccessibleDescription(REASON)
	})

	it('draws no hidden copy when an element already shows the reason', () => {
		render(Host, { reason: REASON, reasonId: 'shown-reason' })

		expect(screen.getAllByText(REASON)).toHaveLength(1)
		expect(button()).toHaveAccessibleDescription(REASON)
	})

	it('shows the reason in a tooltip when the button takes focus', async () => {
		render(Host, { reason: REASON })

		await fireEvent.focusIn(button())

		expect(await screen.findByRole('tooltip')).toHaveTextContent(REASON)
	})
})
