import { describe, expect, it } from 'vitest'

import { useEditedTargets } from '../use-edited-targets.svelte'

const DRIFT_THRESHOLD = 1

const createTargets = (live: number[]) =>
	useEditedTargets<number>(
		(index) => live[index] ?? 0,
		() => DRIFT_THRESHOLD
	)

describe('useEditedTargets', () => {
	it('follows the live value until a field is edited', () => {
		const live = [10, 20]
		const targets = createTargets(live)

		live[0] = 15

		expect(targets.target(0)).toBe(15)
		expect(targets.isEdited(0)).toBe(false)
	})

	it('holds an edited value while the live value moves', () => {
		const live = [10]
		const targets = createTargets(live)

		targets.edit(0, 50)
		live[0] = 15

		expect(targets.target(0)).toBe(50)
		expect(targets.isEdited(0)).toBe(true)
	})

	it('reports no drift within the threshold', () => {
		const live = [10]
		const targets = createTargets(live)

		targets.edit(0, 50)
		live[0] = 10.5

		expect(targets.drift(0)).toBeUndefined()
	})

	it('reports drift past the threshold, measured from the last edit', () => {
		const live = [10]
		const targets = createTargets(live)

		targets.edit(0, 50)
		live[0] = 13
		expect(targets.drift(0)).toBe(3)

		targets.edit(0, 55)
		expect(targets.drift(0)).toBeUndefined()
	})

	it('never reports drift for an unedited field', () => {
		const live = [10]
		const targets = createTargets(live)

		live[0] = 100

		expect(targets.drift(0)).toBeUndefined()
	})

	it('has no baseline for an unedited field', () => {
		const targets = createTargets([10])

		expect(targets.baseline(0)).toBeUndefined()
	})

	it('records the live value at edit time as the baseline', () => {
		const live = [10]
		const targets = createTargets(live)

		targets.edit(0, 50)

		expect(targets.baseline(0)).toBe(10)
	})

	it('keeps the baseline when the live value moves', () => {
		const live = [10]
		const targets = createTargets(live)

		targets.edit(0, 50)
		live[0] = 13

		expect(targets.baseline(0)).toBe(10)
	})

	it('takes the new live value as the baseline on a second edit', () => {
		const live = [10]
		const targets = createTargets(live)

		targets.edit(0, 50)
		live[0] = 13
		targets.edit(0, 55)

		expect(targets.baseline(0)).toBe(13)
	})

	it('clears the baseline on reset', () => {
		const targets = createTargets([10])

		targets.edit(0, 50)
		targets.reset(0)

		expect(targets.baseline(0)).toBeUndefined()
	})

	it('returns a field to the live value on reset', () => {
		const live = [10, 20]
		const targets = createTargets(live)

		targets.edit(0, 50)
		targets.edit(1, 60)
		targets.reset(0)

		expect(targets.target(0)).toBe(10)
		expect(targets.target(1)).toBe(60)

		targets.resetAll()
		expect(targets.target(1)).toBe(20)
	})
})
