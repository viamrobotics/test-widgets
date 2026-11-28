import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { createDetectionContext, DETECTIONS_CONTEXT_KEY } from '../context.svelte.ts'
import Subject from '../Legend.svelte'
import { classifications } from './__fixtures__/classifications.ts'
import { detection } from './__fixtures__/detections.ts'

describe('<Legend>', () => {
	it('adds label sections with total count', () => {
		const detectionContext = createDetectionContext(() => [
			{ ...detection },
			{ ...detection, confidence: 0.2 },
			{ ...detection, className: 'Caviar' },
		])

		render(Subject, {
			context: new Map([[DETECTIONS_CONTEXT_KEY, detectionContext]]),
			props: {
				classificationsSupported: false,
				detectionsSupported: true,
			},
		})

		const { Wagyu, Caviar } = detectionContext.byLabel

		const button1 = screen.getByRole('button', { name: /wagyu/iu })
		expect(button1).toBeInTheDocument()
		const total1 = within(button1).getByText(Wagyu?.detections.length ?? '')
		expect(total1).toBeInTheDocument()

		const button2 = screen.getByRole('button', { name: /caviar/iu })
		expect(button2).toBeInTheDocument()
		const total2 = within(button2).getByText(Caviar?.detections.length ?? '')
		expect(total2).toBeInTheDocument()
	})

	it('adds expandable label sections with confidence levels per section', async () => {
		const detectionContext = createDetectionContext(() => [
			{ ...detection },
			{ ...detection, confidence: 0.2 },
			{ ...detection, className: 'Caviar' },
		])

		const user = userEvent.setup()

		render(Subject, {
			context: new Map([[DETECTIONS_CONTEXT_KEY, detectionContext]]),
			props: {
				classificationsSupported: false,
				detectionsSupported: true,
			},
		})

		const { Wagyu, Caviar } = detectionContext.byLabel

		const label1 = screen.getByRole('button', { name: 'Wagyu' })
		await user.click(label1)
		const item1 = screen.getByRole('button', {
			name: `Wagyu ${Wagyu?.detections[0]?.confidence.toString() ?? ''}%`,
		})
		const item2 = screen.getByRole('button', {
			name: `Wagyu ${Wagyu?.detections[1]?.confidence.toString() ?? ''}%`,
		})
		expect(item1).toBeInTheDocument()
		expect(item2).toBeInTheDocument()

		const label2 = screen.getByRole('button', { name: /caviar/iu })
		await user.click(label2)
		const item3 = screen.getByRole('button', {
			name: `Caviar ${Caviar?.detections[0]?.confidence.toString() ?? ''}%`,
		})
		expect(item3).toBeInTheDocument()
	})

	it('lists classifications alone, with each confidence as a readout, when only they are supported', () => {
		const context = createDetectionContext(() => [])

		render(Subject, {
			context: new Map([[DETECTIONS_CONTEXT_KEY, context]]),
			props: {
				classificationsSupported: true,
				detectionsSupported: false,
				classifications,
			},
		})

		const list = screen.getByRole('list', { name: 'Classifications' })
		expect(screen.queryByRole('group', { name: 'Legend view' })).not.toBeInTheDocument()
		expect(
			within(list)
				.getAllByRole('listitem')
				.map((item) => item.textContent)
		).toEqual(['dog 50.00 %', 'dragon 40.00 %', 'liopleurodon 10.00 %'])
	})

	it('offers no Legend view toggle when only detections are supported', () => {
		render(Subject, {
			context: new Map([[DETECTIONS_CONTEXT_KEY, createDetectionContext(() => [detection])]]),
			props: {
				classificationsSupported: false,
				detectionsSupported: true,
			},
		})

		expect(screen.queryByRole('group', { name: 'Legend view' })).not.toBeInTheDocument()
		expect(screen.getByRole('list', { name: 'Labels' })).toBeInTheDocument()
	})

	it('switches from Labels to Classifications with the Legend view toggle when both are supported', async () => {
		const user = userEvent.setup()
		render(Subject, {
			context: new Map([[DETECTIONS_CONTEXT_KEY, createDetectionContext(() => [detection])]]),
			props: {
				classificationsSupported: true,
				detectionsSupported: true,
				classifications,
			},
		})
		expect(screen.getByRole('radio', { name: 'Labels' })).toBeChecked()

		await user.click(screen.getByRole('radio', { name: 'Classifications' }))

		expect(screen.getByRole('list', { name: 'Classifications' })).toBeInTheDocument()
		expect(screen.queryByRole('list', { name: 'Labels' })).not.toBeInTheDocument()
	})
})
