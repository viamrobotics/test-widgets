import { render } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'

import StatusLine from '../status-line.svelte'

describe('<StatusLine>', () => {
	it('Renders the polite live region with no text when empty', () => {
		const { getByTestId } = render(StatusLine, { props: { text: '' } })
		const region = getByTestId('status-line')

		expect(region).toHaveAttribute('aria-live', 'polite')
		expect(region).not.toHaveAttribute('role')
		expect(region).toHaveTextContent('')
		expect(region.textContent?.trim()).toBe('')
	})

	it('Shows new text in the same element after a rerender', async () => {
		const { getByTestId, rerender } = render(StatusLine, { props: { text: '' } })
		const region = getByTestId('status-line')

		await rerender({ text: 'Moving to position' })

		expect(getByTestId('status-line')).toBe(region)
		expect(region).toHaveTextContent('Moving to position')
		expect(region).toHaveAttribute('aria-live', 'polite')
	})
})
