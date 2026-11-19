import '../../../../../app.css'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Subject from '../position.svelte'

const PANE_BODY_WIDTH = '302px'
const NUMBERED_THIRTEEN = { numPositions: 13, labels: [] }
const LABELED_THREE = { numPositions: 3, labels: ['Off', 'On', 'Auto'] }

const hosts: HTMLElement[] = []

const hostOfWidth = (width: string) => {
	const host = document.createElement('div')
	host.style.width = width
	document.body.append(host)
	hosts.push(host)
	return host
}

const nextFrame = () =>
	new Promise<void>((resolve) => {
		requestAnimationFrame(() => {
			resolve()
		})
	})

const settleLayout = async () => {
	await document.fonts.ready
	await nextFrame()
	await nextFrame()
}

const renderAt = (
	width: string,
	positions: { numPositions: number; labels: string[] },
	currentPosition = 1,
	onSelect = vi.fn()
) => {
	const host = hostOfWidth(width)
	const result = render(Subject, {
		target: host,
		props: { ...positions, currentPosition, onSelect },
	})
	return { host, onSelect, ...result }
}

const labelOf = (group: HTMLElement) => {
	const label = document.querySelector<HTMLElement>(
		`[id="${group.getAttribute('aria-labelledby') ?? ''}"]`
	)
	if (!label) throw new Error('The group has no visible label')
	return label
}

afterEach(() => {
	for (const host of hosts.splice(0)) host.remove()
})

describe('Switch position toggle', () => {
	it('calls onSelect with a picked position', async () => {
		const { onSelect } = renderAt(PANE_BODY_WIDTH, LABELED_THREE)
		await settleLayout()

		await userEvent.click(screen.getByRole('radio', { name: 'Auto' }))

		expect(onSelect).toHaveBeenCalledWith(2)
	})

	it('keeps the selection on the reported position after a pick', async () => {
		renderAt(PANE_BODY_WIDTH, LABELED_THREE)
		await settleLayout()

		await userEvent.click(screen.getByRole('radio', { name: 'Auto' }))

		expect(screen.getByRole('radio', { name: 'On' })).toBeChecked()
		expect(screen.getByRole('radio', { name: 'Auto' })).not.toBeChecked()
	})

	it('sends nothing when the reported position is picked again', async () => {
		const { onSelect } = renderAt(PANE_BODY_WIDTH, LABELED_THREE)
		await settleLayout()

		await userEvent.click(screen.getByRole('radio', { name: 'On' }))

		expect(onSelect).not.toHaveBeenCalled()
	})

	it('picks the right position when two share a label', async () => {
		const { onSelect } = renderAt(
			PANE_BODY_WIDTH,
			{ numPositions: 3, labels: ['On', 'On', 'Off'] },
			2
		)
		await settleLayout()

		const secondOn = screen.getAllByRole('radio', { name: 'On' })[1]
		if (!secondOn) throw new Error('The second On position did not render')
		await userEvent.click(secondOn)

		expect(onSelect).toHaveBeenCalledWith(1)
	})

	it('numbers unlabeled positions from 0', async () => {
		renderAt(PANE_BODY_WIDTH, { numPositions: 3, labels: [] }, 0)
		await settleLayout()

		expect(screen.getAllByRole('radio').map((radio) => radio.textContent)).toEqual(['0', '1', '2'])
	})

	it('keeps every item at least 24 px wide', async () => {
		renderAt(PANE_BODY_WIDTH, { numPositions: 3, labels: [] }, 0)
		await settleLayout()

		expect(
			screen.getAllByRole('radio').map((radio) => radio.getBoundingClientRect().width)
		).toEqual([24, 24, 24])
	})
})

describe('Switch position width rule', () => {
	it('draws the Select before the first measurement', () => {
		renderAt(PANE_BODY_WIDTH, LABELED_THREE)

		expect(screen.getByRole('combobox', { name: 'Position' })).toBeInTheDocument()
	})

	it('puts 3 labeled positions beside the label in the 302 px body of a 320 px pane', async () => {
		renderAt(PANE_BODY_WIDTH, LABELED_THREE)
		await settleLayout()

		const group = screen.getByRole('group', { name: 'Position' })
		const label = labelOf(group)

		expect(group.getBoundingClientRect().top, 'group top').toBeLessThan(
			label.getBoundingClientRect().bottom
		)
	})

	it('drops 12 numbered positions under the label in the 302 px body of a 320 px pane', async () => {
		renderAt(PANE_BODY_WIDTH, { numPositions: 12, labels: [] })
		await settleLayout()

		const group = screen.getByRole('group', { name: 'Position' })
		const label = labelOf(group)

		expect(group.getBoundingClientRect().top, 'group top').toBeGreaterThanOrEqual(
			label.getBoundingClientRect().bottom
		)
	})

	it('draws 13 numbered positions as a Select in the 302 px body of a 320 px pane', async () => {
		renderAt(PANE_BODY_WIDTH, NUMBERED_THIRTEEN)
		await settleLayout()

		expect(screen.getByRole('combobox', { name: 'Position' })).toBeInTheDocument()
		expect(screen.queryByRole('radio')).not.toBeInTheDocument()
	})

	it('draws 13 numbered positions as the toggle group at 672 px', async () => {
		renderAt('672px', NUMBERED_THIRTEEN)
		await settleLayout()

		expect(screen.getAllByRole('radio')).toHaveLength(13)
		expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
	})

	it('swaps the toggle group for a Select when the host narrows', async () => {
		const { host } = renderAt('672px', NUMBERED_THIRTEEN)
		await settleLayout()

		host.style.width = PANE_BODY_WIDTH
		await settleLayout()

		expect(screen.getByRole('combobox', { name: 'Position' })).toBeInTheDocument()
	})

	it('sends one pick from the Select', async () => {
		const { onSelect } = renderAt(PANE_BODY_WIDTH, NUMBERED_THIRTEEN)
		await settleLayout()

		await userEvent.click(screen.getByRole('combobox', { name: 'Position' }))
		await userEvent.click(await screen.findByRole('option', { name: '12' }))

		expect(onSelect).toHaveBeenCalledTimes(1)
		expect(onSelect).toHaveBeenCalledWith(12)
	})

	it('re-chooses the layout when the item list changes on the same mount', async () => {
		const { rerender } = renderAt(PANE_BODY_WIDTH, LABELED_THREE)
		await settleLayout()
		expect(screen.getAllByRole('radio'), '3 labeled positions first').toHaveLength(3)

		await rerender(NUMBERED_THIRTEEN)
		await settleLayout()

		expect(screen.getByRole('combobox', { name: 'Position' })).toBeInTheDocument()
		expect(screen.queryByRole('radio')).not.toBeInTheDocument()
	})

	it('disconnects every resize observer it starts on unmount', async () => {
		const observe = vi.spyOn(ResizeObserver.prototype, 'observe')
		const disconnect = vi.spyOn(ResizeObserver.prototype, 'disconnect')
		const { unmount } = renderAt(PANE_BODY_WIDTH, LABELED_THREE)
		await settleLayout()
		expect(observe, 'the probe and the row sizer').toHaveBeenCalledTimes(2)

		unmount()

		expect(disconnect).toHaveBeenCalledTimes(2)
	})

	it('does not scroll the host horizontally with 13 numbered positions', async () => {
		const { host } = renderAt(PANE_BODY_WIDTH, NUMBERED_THIRTEEN)
		await settleLayout()

		expect(host.scrollWidth).toBeLessThanOrEqual(host.clientWidth)
	})
})
