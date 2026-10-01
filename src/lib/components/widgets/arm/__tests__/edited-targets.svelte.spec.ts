import { describe, expect, it } from 'vitest'

import { EditedTargets } from '../edited-targets.svelte'

const DRIFT_THRESHOLD = 1

const createTargets = (live: number[]) =>
	new EditedTargets<number>(
		(index) => live[index] ?? 0,
		() => DRIFT_THRESHOLD
	)

describe('EditedTargets', () => {
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
