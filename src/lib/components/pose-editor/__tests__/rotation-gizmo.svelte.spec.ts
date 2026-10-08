import '../../../../app.css'

import { fireEvent, render, screen } from '@testing-library/svelte'
import userEvent, { PointerEventsCheckLevel } from '@testing-library/user-event'
import { beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'

import type { OrientationVector } from '$lib/orientation-vector-quaternion'

import { turnBetween } from './__fixtures__/orientation-turn'
import Host from './__fixtures__/rotation-gizmo-host.svelte'

const identity: OrientationVector = { oX: 0, oY: 0, oZ: 1, theta: 0 }
const awayFromPole: OrientationVector = { oX: 0.6, oY: 0, oZ: 0.8, theta: 30 }

interface Point {
	clientX: number
	clientY: number
}

describe('RotationGizmo', () => {
	let user: ReturnType<typeof userEvent.setup>

	beforeEach(() => {
		user = userEvent.setup()
	})

	const renderGizmo = (orientation = identity) => {
		const onChange = vi.fn<(orientation: OrientationVector) => void>()
		render(Host, { orientation, onChange })
		const pad = screen.getByRole('application', { name: 'Rotation gizmo' })
		return { onChange, pad }
	}

	const lastWritten = (onChange: { mock: { calls: OrientationVector[][] } }) => {
		const lastCall = onChange.mock.calls.at(-1)
		if (!lastCall) throw new Error('The gizmo wrote no orientation')
		return lastCall[0]
	}

	const centerOf = (element: Element): Point => {
		const { left, top, width, height } = element.getBoundingClientRect()
		return { clientX: left + width / 2, clientY: top + height / 2 }
	}

	const dragBetween = (target: Element, from: Point, to: Point) =>
		user.pointer([
			{ keys: '[MouseLeft>]', target, coords: from },
			{ target, coords: to },
			{ keys: '[/MouseLeft]', target, coords: to },
		])

	const ringHitPaths = (pad: Element) => [...pad.querySelectorAll('path[pointer-events="stroke"]')]

	it('names the pad Rotation gizmo with the application role', () => {
		const { pad } = renderGizmo()

		expect(pad).toBeInTheDocument()
	})

	it('takes focus when tabbed to', async () => {
		const { pad } = renderGizmo()

		await user.tab()

		expect(pad).toHaveFocus()
	})

	it.each([
		{ name: 'ArrowRight', keys: '{ArrowRight}', turn: Math.PI / 16 },
		{ name: 'Shift+ArrowRight', keys: '{Shift>}{ArrowRight}{/Shift}', turn: (10 * Math.PI) / 16 },
	])('turns the orientation $turn rad on $name', async ({ keys, turn }) => {
		const { onChange, pad } = renderGizmo()
		pad.focus()

		await user.keyboard(keys)

		expect(turnBetween(identity, lastWritten(onChange))).toBeCloseTo(turn, 6)
	})

	it('turns the orientation π/160 rad on Alt+ArrowRight', async () => {
		const { onChange, pad } = renderGizmo(awayFromPole)
		pad.focus()

		await user.keyboard('{Alt>}{ArrowRight}{/Alt}')

		expect(turnBetween(awayFromPole, lastWritten(onChange))).toBeCloseTo(Math.PI / 160, 6)
	})

	it('prevents the default action of an arrow key', async () => {
		const { pad } = renderGizmo()

		const wasNotPrevented = await fireEvent.keyDown(pad, { key: 'ArrowDown' })

		expect(wasNotPrevented).toBe(false)
	})

	it('writes an orientation more than 0.1 rad away when dragged across the pad from the center', async () => {
		const { onChange, pad } = renderGizmo()
		const start = centerOf(pad)

		await dragBetween(pad, start, { ...start, clientX: start.clientX + 30 })

		expect(turnBetween(identity, lastWritten(onChange))).toBeGreaterThan(0.1)
	})

	it('turns a quarter turn about the view axis when the roll ring is dragged a quarter turn around the center', async () => {
		const { onChange, pad } = renderGizmo()
		const center = centerOf(pad)
		const rollRing = ringHitPaths(pad).at(-1)
		if (!rollRing) throw new Error('The gizmo drew no ring')

		await dragBetween(
			rollRing,
			{ ...center, clientX: center.clientX + 50 },
			{ ...center, clientY: center.clientY + 50 }
		)

		expect(turnBetween(identity, lastWritten(onChange))).toBeCloseTo(Math.PI / 2, 6)
	})

	it('turns a quarter turn when an axis ring is dragged a quarter turn around the center', async () => {
		const { onChange, pad } = renderGizmo()
		const center = centerOf(pad)
		const [xRing] = ringHitPaths(pad)
		if (!xRing) throw new Error('The gizmo drew no ring')

		await dragBetween(
			xRing,
			{ ...center, clientX: center.clientX + 50 },
			{ ...center, clientY: center.clientY + 50 }
		)

		expect(turnBetween(identity, lastWritten(onChange))).toBeCloseTo(Math.PI / 2, 6)
	})

	it('writes nothing when a label is clicked', async () => {
		const clickThroughLabels = userEvent.setup({
			pointerEventsCheck: PointerEventsCheckLevel.Never,
		})
		const { onChange } = renderGizmo()

		await clickThroughLabels.click(screen.getByText('X'))

		expect(onChange).not.toHaveBeenCalled()
	})

	it('measures 136 by 136 px inside a 1200 px wide container', () => {
		const host = document.createElement('div')
		host.style.width = '1200px'
		document.body.append(host)
		onTestFinished(() => {
			host.remove()
		})
		render(Host, { props: { orientation: identity, onChange: vi.fn() }, target: host })

		const box = host.querySelector('svg')?.getBoundingClientRect()

		expect([box?.width, box?.height]).toEqual([136, 136])
	})
})
