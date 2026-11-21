import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from './__fixtures__/press-and-hold-button.svelte'

describe('pressAndHold', () => {
	let user: ReturnType<typeof userEvent.setup>
	let onPress: () => void
	let onRelease: () => void

	beforeEach(() => {
		user = userEvent.setup()
		onPress = vi.fn()
		onRelease = vi.fn()
		render(Subject, { onPress, onRelease })
	})

	const getButton = () => screen.getByRole('button', { name: /hold/iu })

	it('presses on pointer down and releases on pointer up', async () => {
		await user.pointer({ target: getButton(), keys: '[MouseLeft>]' })

		expect(onPress).toHaveBeenCalledTimes(1)
		expect(onRelease).not.toHaveBeenCalled()

		await user.pointer({ keys: '[/MouseLeft]' })

		expect(onPress).toHaveBeenCalledTimes(1)
		expect(onRelease).toHaveBeenCalledTimes(1)
	})

	it('ignores a non-primary pointer button', async () => {
		await user.pointer({ target: getButton(), keys: '[MouseRight]' })

		expect(onPress).not.toHaveBeenCalled()
		expect(onRelease).not.toHaveBeenCalled()
	})

	it.each(['[Space>]', '{Enter>}'])(
		'holds while %s is down and releases on key up',
		async (down) => {
			getButton().focus()
			await user.keyboard(down)

			expect(onPress).toHaveBeenCalledTimes(1)
			expect(onRelease).not.toHaveBeenCalled()

			await user.keyboard(down.startsWith('[') ? '[/Space]' : '{/Enter}')

			expect(onRelease).toHaveBeenCalledTimes(1)
		}
	)

	it('presses once while a held key repeats', async () => {
		getButton().focus()
		await user.keyboard('{Enter>3/}')

		expect(onPress).toHaveBeenCalledTimes(1)
		expect(onRelease).toHaveBeenCalledTimes(1)
	})

	it('releases when the button loses focus mid-hold', async () => {
		const button = getButton()
		button.focus()
		await user.keyboard('[Space>]')
		button.blur()

		expect(onRelease).toHaveBeenCalledTimes(1)
	})

	it('releases when the tab becomes hidden mid-hold', async () => {
		await user.pointer({ target: getButton(), keys: '[MouseLeft>]' })
		vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
		document.dispatchEvent(new Event('visibilitychange'))

		expect(onRelease).toHaveBeenCalledTimes(1)
	})

	it('calls nothing when released without a press', async () => {
		const button = getButton()
		button.focus()
		await user.keyboard('[/Space]')
		button.blur()

		expect(onPress).not.toHaveBeenCalled()
		expect(onRelease).not.toHaveBeenCalled()
	})
})
