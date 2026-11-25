import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { type ArmHome, createArmHome } from '../arm-home.svelte'

const disposers: (() => void)[] = []

const createHome = (partID: string, resourceName: string): ArmHome => {
	let home: ArmHome | undefined
	disposers.push(
		$effect.root(() => {
			home = createArmHome(() => ({ partID, resourceName }))
		})
	)
	if (!home) throw new Error('createArmHome returned nothing')
	return home
}

beforeEach(() => {
	localStorage.clear()
})

afterEach(() => {
	for (const dispose of disposers.splice(0)) dispose()
	localStorage.clear()
})

describe('createArmHome', () => {
	it('is undefined until saved and never writes on read', () => {
		const home = createHome('part-1', 'arm-1')
		expect(home.jointDegrees).toBeUndefined()
		expect(localStorage.length).toBe(0)
	})

	it('reads back after save and stores under the part and arm key', () => {
		const home = createHome('part-1', 'arm-1')
		home.save([0, 45, -90])
		expect(home.jointDegrees).toEqual([0, 45, -90])
		expect(localStorage.getItem('part-1/arm-1/arm-home')).toBe('[0,45,-90]')
	})

	it('is keyed per part and per arm', () => {
		createHome('part-1', 'arm-1').save([1, 2])
		expect(createHome('part-1', 'arm-1').jointDegrees).toEqual([1, 2])
		expect(createHome('part-2', 'arm-1').jointDegrees).toBeUndefined()
		expect(createHome('part-1', 'arm-2').jointDegrees).toBeUndefined()
	})

	it.each(['not json', '{"a":1}', '[]', '[1,"x"]', 'null'])(
		'ignores the malformed stored value %s',
		(stored) => {
			localStorage.setItem('part-1/arm-1/arm-home', stored)
			expect(createHome('part-1', 'arm-1').jointDegrees).toBeUndefined()
		}
	)
})
