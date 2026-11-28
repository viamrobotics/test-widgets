import type { ComponentProps } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import JogRow from '../JogRow.svelte'

type JogRowProps = ComponentProps<typeof JogRow>

const renderRow = (overrides: Partial<JogRowProps> = {}) => {
	const onPress = vi.fn<JogRowProps['onPress']>()
	const onRelease = vi.fn<JogRowProps['onRelease']>()
	render(JogRow, {
		label: 'Axis 0',
		value: 412.5,
		formatValue: (value: number) => value.toFixed(2),
		unit: 'mm',
		step: 10,
		min: 0,
		max: 1000,
		isBusy: false,
		onPress,
		onRelease,
		...overrides,
	})
	return { onPress, onRelease }
}

const getDecrease = () => screen.getByRole('button', { name: '−10 mm, Axis 0' })
const getIncrease = () => screen.getByRole('button', { name: '+10 mm, Axis 0' })

describe('JogRow', () => {
	it('names the group by its label', () => {
		renderRow()

		expect(screen.getByRole('group', { name: 'Axis 0' })).toBeInTheDocument()
	})

	it('shows each stepper as a signed step with its unit', () => {
		renderRow()

		expect(getDecrease()).toHaveTextContent('−10 mm')
		expect(getIncrease()).toHaveTextContent('+10 mm')
	})

	it('names each stepper by its visible text, then the row label', () => {
		renderRow()

		expect(getDecrease()).toHaveAccessibleName('−10 mm, Axis 0')
		expect(getIncrease()).toHaveAccessibleName('+10 mm, Axis 0')
	})

	it('sets a degree step flush against its number, in the text and the name', () => {
		renderRow({ label: 'Position', unit: '°', step: 5 })

		const increase = screen.getByRole('button', { name: '+5°, Position' })

		expect(increase).toHaveTextContent('+5°')
		expect(screen.getByRole('button', { name: '−5°, Position' })).toHaveTextContent('−5°')
	})

	it('keeps the live value in its slot while busy', () => {
		renderRow({ isBusy: true })

		expect(screen.getByRole('group', { name: 'Axis 0' })).toHaveTextContent(
			'−10 mm 412.50mm +10 mm'
		)
	})

	it('shows a placeholder while the value is unknown', () => {
		renderRow({ value: undefined })

		expect(screen.getByRole('group', { name: 'Axis 0' })).toHaveTextContent('−10 mm - +10 mm')
	})

	it('marks both steppers aria-disabled while busy', () => {
		renderRow({ isBusy: true })

		expect(getDecrease()).toHaveAttribute('aria-disabled', 'true')
		expect(getIncrease()).toHaveAttribute('aria-disabled', 'true')
	})

	it('keeps a busy stepper focusable', async () => {
		renderRow({ isBusy: true })
		const user = userEvent.setup()

		await user.tab()

		expect(getDecrease()).toHaveFocus()
	})

	it('leaves both steppers enabled when idle inside the bounds', () => {
		renderRow()

		expect(getDecrease()).not.toHaveAttribute('aria-disabled')
		expect(getIncrease()).not.toHaveAttribute('aria-disabled')
	})

	it('disables only the increase stepper at max', () => {
		renderRow({ value: 1000 })

		expect(getIncrease()).toHaveAttribute('aria-disabled', 'true')
		expect(getDecrease()).not.toHaveAttribute('aria-disabled')
	})

	it('disables only the decrease stepper at min', () => {
		renderRow({ value: 0 })

		expect(getDecrease()).toHaveAttribute('aria-disabled', 'true')
		expect(getIncrease()).not.toHaveAttribute('aria-disabled')
	})

	it('calls nothing on a press and release of a busy stepper', async () => {
		const { onPress, onRelease } = renderRow({ isBusy: true })
		const user = userEvent.setup()

		await user.pointer({ target: getIncrease(), keys: '[MouseLeft]' })

		expect(onPress).not.toHaveBeenCalled()
		expect(onRelease).not.toHaveBeenCalled()
	})

	it('calls nothing on a press and release of the stepper toward a reached bound', async () => {
		const { onPress, onRelease } = renderRow({ value: 1000 })
		const user = userEvent.setup()

		await user.pointer({ target: getIncrease(), keys: '[MouseLeft]' })

		expect(onPress).not.toHaveBeenCalled()
		expect(onRelease).not.toHaveBeenCalled()
	})

	it('presses with the stepper direction, then releases once', async () => {
		const { onPress, onRelease } = renderRow()
		const user = userEvent.setup()

		await user.pointer({ target: getDecrease(), keys: '[MouseLeft>]' })

		expect(onPress, 'the press starts the hold').toHaveBeenCalledExactlyOnceWith('decrease')
		expect(onRelease, 'nothing releases mid-hold').not.toHaveBeenCalled()

		await user.pointer({ keys: '[/MouseLeft]' })

		expect(onPress, 'the release does not press again').toHaveBeenCalledTimes(1)
		expect(onRelease, 'the release ends the hold').toHaveBeenCalledTimes(1)
	})

	it('holds from the keyboard on the increase stepper', async () => {
		const { onPress, onRelease } = renderRow()
		const user = userEvent.setup()
		getIncrease().focus()

		await user.keyboard('[Space]')

		expect(onPress).toHaveBeenCalledExactlyOnceWith('increase')
		expect(onRelease).toHaveBeenCalledTimes(1)
	})

	it('marks the held stepper busy and the other aria-disabled', () => {
		renderRow({ busyDirection: 'increase' })

		expect(getIncrease()).toHaveAttribute('aria-busy', 'true')
		expect(getDecrease()).not.toHaveAttribute('aria-busy')
		expect(getDecrease()).toHaveAttribute('aria-disabled', 'true')
	})

	it('keeps the held stepper name and the live value', () => {
		renderRow({ busyDirection: 'increase' })

		expect(getIncrease()).toHaveAccessibleName('+10 mm, Axis 0')
		expect(screen.getByRole('group', { name: 'Axis 0' })).toHaveTextContent(
			'−10 mm 412.50mm +10 mm'
		)
	})

	it('marks neither stepper busy without a held direction', () => {
		renderRow()

		expect(getIncrease()).not.toHaveAttribute('aria-busy')
		expect(getDecrease()).not.toHaveAttribute('aria-busy')
	})

	it('drops a press on either stepper while a hold is shown', async () => {
		const { onPress } = renderRow({ busyDirection: 'increase' })
		const user = userEvent.setup()

		await user.pointer({ target: getDecrease(), keys: '[MouseLeft]' })
		await user.pointer({ target: getIncrease(), keys: '[MouseLeft]' })

		expect(onPress).not.toHaveBeenCalled()
	})

	it('points both steppers at the description', () => {
		renderRow({ describedBy: 'manual-hint' })

		expect(getDecrease()).toHaveAttribute('aria-describedby', 'manual-hint')
		expect(getIncrease()).toHaveAttribute('aria-describedby', 'manual-hint')
	})

	it('references no description by default', () => {
		renderRow()

		expect(getIncrease()).not.toHaveAttribute('aria-describedby')
	})

	it('draws the track marker at the value between min and max', () => {
		renderRow({ value: 250, min: 0, max: 1000 })

		const marker = screen.getByTestId('jog-track').firstElementChild

		expect(marker?.getAttribute('style')).toBe('left: 25%;')
	})

	it('draws no track without a max', () => {
		renderRow({ max: undefined })

		expect(screen.queryByTestId('jog-track')).not.toBeInTheDocument()
	})

	it('draws no track when max does not exceed min', () => {
		renderRow({ value: 5, min: 5, max: 5 })

		expect(screen.queryByTestId('jog-track')).not.toBeInTheDocument()
	})
})
