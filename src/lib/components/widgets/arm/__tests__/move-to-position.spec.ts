import type { Pose } from '@viamrobotics/sdk'
import type { ComponentProps } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { assertExists } from '$lib/assert'

import Subject from '../move-to-position.svelte'

describe('Arm move-to-position', () => {
	let user: ReturnType<typeof userEvent.setup>

	const defaultPose: Pose = {
		x: 1,
		y: 2,
		z: 3,
		oX: 0,
		oY: 0.6,
		oZ: 0.8,
		theta: 7,
	}

	beforeEach(() => {
		user = userEvent.setup()
	})

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
		render(Subject, {
			endPosition: defaultPose,
			moveToPosition: vi.fn(),
			lastError: null,
			...props,
		})

	it('renders a row for each pose parameter', () => {
		renderSubject({})

		const positionInputs = screen.getAllByRole('spinbutton')
		// x, y, z, oX, oY, oZ, theta
		expect(positionInputs).toHaveLength(7)
	})

	it('trims position values to 1 decimal place', () => {
		renderSubject({
			endPosition: {
				...defaultPose,
				x: 1.234_567,
				y: 2.345_678,
				z: 3.456_789,
			},
		})

		expect(screen.getByRole('spinbutton', { name: 'X' })).toHaveValue(1.2)
		expect(screen.getByRole('spinbutton', { name: 'Y' })).toHaveValue(2.3)
		expect(screen.getByRole('spinbutton', { name: 'Z' })).toHaveValue(3.5)
	})

	it('resets to zero when Zero button is clicked', async () => {
		renderSubject({})

		const positionInputs = screen.getAllByRole('spinbutton')
		// set one position to a non-default value
		const nonDefaultPos = positionInputs[0]!

		await user.clear(nonDefaultPos)
		await user.type(nonDefaultPos, '100')
		expect(nonDefaultPos).toHaveValue(100)

		// press zero
		const zeroButton = screen.getByRole('button', { name: /zero/iu })
		await user.click(zeroButton)

		for (const input of positionInputs) {
			expect(input).toHaveValue(0)
		}
	})

	it('resets desired positions when Current position button is clicked', async () => {
		renderSubject({})

		const positionInputs = screen.getAllByRole('spinbutton')

		// set one position input to a non-default value
		const nonDefaultPos = positionInputs[0]
		assertExists(nonDefaultPos, 'Expected a position input')

		await user.clear(nonDefaultPos)
		await user.type(nonDefaultPos, '42')

		expect(nonDefaultPos).toHaveValue(42)

		// press current
		const currentPositionButton = screen.getByRole('button', {
			name: /current position/iu,
		})
		await user.click(currentPositionButton)

		// Should reset to default pose values
		const poseValues = Object.values(defaultPose)
		for (const [index, input] of positionInputs.entries()) {
			expect(input).toHaveValue(poseValues[index])
		}
	})

	it('calls moveToPosition with the correct parameters when Execute button is clicked', async () => {
		const moveToPosition = vi.fn()
		renderSubject({
			moveToPosition,
		})

		const xInput = screen.getByRole('spinbutton', { name: 'X' })

		await user.clear(xInput)
		await user.type(xInput, '5')

		const executeButton = screen.getByRole('button', { name: /execute/iu })
		await user.click(executeButton)

		expect(moveToPosition).toHaveBeenCalledWith({
			...defaultPose,
			x: 5,
		})
	})

	it('renders a warning tooltip about the motion service and frame system', () => {
		renderSubject({})
		expect(
			screen.getByText(/does not take into account the motion service or frame system/iu)
		).toBeInTheDocument()
	})

	const editField = async (name: string, value: string) => {
		const input = screen.getByRole('spinbutton', { name })
		await user.clear(input)
		await user.type(input, value)
		await user.tab()
		return input
	}

	const editX = (value: string) => editField('X', value)

	it('follows the live pose in fields the user has not edited', async () => {
		const { rerender } = renderSubject({})

		await rerender({ endPosition: { ...defaultPose, x: 50 } })

		expect(screen.getByRole('spinbutton', { name: 'X' })).toHaveValue(50)
	})

	it('names each restore button after the field and its current value', async () => {
		const { rerender } = renderSubject({})

		await rerender({ endPosition: { ...defaultPose, x: 50 } })

		expect(
			screen.getByRole('button', { name: 'Reset X to its current value, 50.0' })
		).toBeInTheDocument()
	})

	it('keeps an edited value when a poll returns a new pose', async () => {
		const { rerender } = renderSubject({})
		const xInput = await editX('42')

		await rerender({ endPosition: { ...defaultPose, x: 1.5 } })

		expect(xInput).toHaveValue(42)
		expect(screen.queryByText(/arm moved/iu)).not.toBeInTheDocument()
	})

	it('flags an edited field once the arm drifts past the threshold', async () => {
		const { rerender } = renderSubject({})
		const xInput = await editX('42')

		await rerender({ endPosition: { ...defaultPose, x: 10 } })

		expect(xInput).toHaveValue(42)
		expect(xInput).toHaveAccessibleDescription(/arm moved 9(\.0+)? mm since you edited x/iu)
	})

	it('resets one edited field to the live value', async () => {
		renderSubject({})
		const xInput = await editX('42')

		await user.click(screen.getByRole('button', { name: /^reset x to its current value/iu }))

		expect(xInput).toHaveValue(1)
		expect(screen.getByRole('button', { name: /^reset x to its current value/iu })).toHaveProperty(
			'tabIndex',
			-1
		)
	})

	it('keeps fields editable but locks Execute while the arm moves', async () => {
		const { rerender } = renderSubject({})
		await editX('42')

		await rerender({ isMoving: true })

		for (const input of screen.getAllByRole('spinbutton')) {
			expect(input).toBeEnabled()
		}
		expect(screen.getByRole('button', { name: /execute/iu })).toBeDisabled()
		expect(screen.getByText('Arm is moving').closest('[role="status"]')).toBeInTheDocument()
	})

	it('marks only edited fields while the arm moves', async () => {
		const { rerender } = renderSubject({})
		await editX('42')

		await rerender({ isMoving: true })

		expect(screen.getByRole('spinbutton', { name: 'X' })).toHaveAccessibleDescription(
			/the arm is moving/iu
		)
		expect(screen.getByRole('spinbutton', { name: 'Y' })).not.toHaveAccessibleDescription(
			/the arm is moving/iu
		)
	})

	it('sends a normalized orientation vector and shows it in the fields when OX is typed on a non-unit vector', async () => {
		const moveToPosition = vi.fn()
		renderSubject({ moveToPosition, endPosition: { ...defaultPose, oX: 0, oY: 0, oZ: -1 } })
		await editField('OX', '0.5')

		await user.click(screen.getByRole('button', { name: /execute/iu }))

		const sent: Pose = moveToPosition.mock.calls[0]![0]
		expect(sent.oX).toBeCloseTo(0.447_214, 6)
		expect(sent.oY).toBe(0)
		expect(sent.oZ).toBeCloseTo(-0.894_427, 6)
		expect(screen.getByRole('spinbutton', { name: 'OX' })).toHaveValue(0.447)
	})

	it('sends a near-unit orientation vector untouched and leaves its fields unedited', async () => {
		const moveToPosition = vi.fn()
		renderSubject({ moveToPosition, endPosition: { ...defaultPose, oX: 0, oY: 0, oZ: 0.9995 } })

		await user.click(screen.getByRole('button', { name: /execute/iu }))

		expect(moveToPosition.mock.calls[0]![0].oZ).toBe(0.9995)
		expect(screen.getByRole('button', { name: /^reset oz to its current value/iu })).toHaveProperty(
			'tabIndex',
			-1
		)
	})

	it('displays the provided error', () => {
		renderSubject({ lastError: new Error('some error msg') })
		expect(screen.getByText(/some error msg/iu)).toBeInTheDocument()
	})
})
