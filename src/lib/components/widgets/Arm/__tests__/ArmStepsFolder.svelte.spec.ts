import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { type ArmJogSteps, createArmJogSteps } from '../arm-jog-steps.svelte'
import Subject, { type ArmStepField } from '../ArmStepsFolder.svelte'

const renderOpen = async (steps: ArmJogSteps, fields: readonly ArmStepField[]) => {
	render(Subject, { props: { steps, fields } })
	await userEvent.click(screen.getByRole('button', { name: /Steps/u }))
}

describe('ArmStepsFolder', () => {
	let steps: ArmJogSteps

	beforeEach(() => {
		steps = createArmJogSteps()
	})

	it('starts closed, with no field showing', () => {
		render(Subject, { props: { steps, fields: ['position'] } })

		expect(screen.queryByRole('spinbutton', { name: 'Position step' })).not.toBeInTheDocument()
	})

	it('shows only the named fields', async () => {
		await renderOpen(steps, ['position', 'straight-line'])

		expect(screen.getByRole('spinbutton', { name: 'Position step' })).toHaveValue(10)
		expect(screen.getByRole('checkbox', { name: 'Move in a straight line' })).toBeChecked()
		expect(screen.queryByRole('spinbutton', { name: 'Orientation step' })).not.toBeInTheDocument()
		expect(screen.queryByRole('spinbutton', { name: 'Joint step' })).not.toBeInTheDocument()
	})

	it('shows the fields in the order named', async () => {
		await renderOpen(steps, ['joint', 'orientation'])

		const joint = screen.getByRole('spinbutton', { name: 'Joint step' })
		const orientation = screen.getByRole('spinbutton', { name: 'Orientation step' })
		expect(joint.compareDocumentPosition(orientation)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
	})

	it('writes an edited Position step into steps', async () => {
		await renderOpen(steps, ['position'])
		const field = screen.getByRole('spinbutton', { name: 'Position step' })

		await userEvent.tripleClick(field)
		await userEvent.keyboard('25')

		expect(steps.positionMillimeters).toBe(25)
	})

	it('leaves the Position step unwritten for a value above its 100 mm bound', async () => {
		await renderOpen(steps, ['position'])
		const field = screen.getByRole('spinbutton', { name: 'Position step' })

		await userEvent.tripleClick(field)
		await userEvent.keyboard('250')

		expect(steps.positionMillimeters).toBe(25)
	})

	it('writes the straight line checkbox into steps', async () => {
		await renderOpen(steps, ['straight-line'])

		await userEvent.click(screen.getByRole('checkbox', { name: 'Move in a straight line' }))

		expect(steps.isStraightLine).toBe(false)
	})
})
