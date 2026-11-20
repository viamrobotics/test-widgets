import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import StopButton from '../stop-button.svelte'

describe('<StopButton>', () => {
	it('Is a button named Stop that calls onStop', async () => {
		const onStop = vi.fn()
		render(StopButton, { props: { onStop } })

		await userEvent.click(screen.getByRole('button', { name: 'Stop' }))

		expect(onStop).toHaveBeenCalledOnce()
	})
})
