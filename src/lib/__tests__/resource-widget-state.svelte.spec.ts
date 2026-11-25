import { render } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'

import Pair from './__fixtures__/ResourceWidgetStatePair.svelte'
import Probe from './__fixtures__/ResourceWidgetStateProbe.svelte'
import TwoProviders from './__fixtures__/ResourceWidgetStateTwoProviders.svelte'

const collectStates = () => {
	const states = new Map<string, object>()
	return { states, onState: (label: string, state: object) => states.set(label, state) }
}

describe('defineResourceState', () => {
	it('gives two widgets naming the same resource under one provider the same state', () => {
		const { states, onState } = collectStates()

		render(Pair, {
			first: { partID: 'part-1', resourceName: 'arm-1' },
			second: { partID: 'part-1', resourceName: 'arm-1' },
			onState,
		})

		expect(states.get('first')).toBe(states.get('second'))
	})

	it('gives a different part ID its own state', () => {
		const { states, onState } = collectStates()

		render(Pair, {
			first: { partID: 'part-1', resourceName: 'arm-1' },
			second: { partID: 'part-2', resourceName: 'arm-1' },
			onState,
		})

		expect(states.get('first')).not.toBe(states.get('second'))
	})

	it('gives a different resource name its own state', () => {
		const { states, onState } = collectStates()

		render(Pair, {
			first: { partID: 'part-1', resourceName: 'arm-1' },
			second: { partID: 'part-1', resourceName: 'arm-2' },
			onState,
		})

		expect(states.get('first')).not.toBe(states.get('second'))
	})

	it('keeps separate states for the same resource under two providers', () => {
		const { states, onState } = collectStates()

		render(TwoProviders, { partID: 'part-1', resourceName: 'arm-1', onState })

		expect(states.get('first')).not.toBe(states.get('second'))
	})

	it('throws an error naming WidgetsProvider when no provider sits above the widget', () => {
		expect(() =>
			render(Probe, { partID: 'part-1', resourceName: 'arm-1', onState: () => undefined })
		).toThrow(/WidgetsProvider/)
	})
})
