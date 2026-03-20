import type { Pose } from '@viamrobotics/sdk'
import type { ComponentProps } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { assertExists } from '$lib/assert'

import Subject from '../move-to-position.svelte'

describe('ArmView move-to-position', () => {
	let user: ReturnType<typeof userEvent.setup>

	const defaultPose: Pose = {
		x: 1,
		y: 2,
		z: 3,
		oX: 4,
		oY: 5,
		oZ: 6,
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

	it('trims pose values to 2 decimal places', () => {
		renderSubject({
			endPosition: {
				...defaultPose,
				x: 1.234_567,
				y: 2.345_678,
				z: 3.456_789,
			},
		})

		const positionInputs = screen.getAllByRole('spinbutton')

		expect(positionInputs[0]).toHaveValue(1.23)
		expect(positionInputs[1]).toHaveValue(2.35)
		expect(positionInputs[2]).toHaveValue(3.46)
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

		const positionInputs = screen.getAllByRole('spinbutton')
		const xInput = positionInputs[0]
		assertExists(xInput, 'Expected a position input')

		await user.clear(xInput)
		await user.type(xInput, '5')

		const executeButton = screen.getByRole('button', { name: /execute/iu })
		await user.click(executeButton)

		expect(moveToPosition).toHaveBeenCalledWith({
			...defaultPose,
			x: 5,
		})
	})

	it('displays the provided error', () => {
		renderSubject({ lastError: new Error('some error msg') })
		expect(screen.getByText(/some error msg/iu)).toBeInTheDocument()
	})
})
