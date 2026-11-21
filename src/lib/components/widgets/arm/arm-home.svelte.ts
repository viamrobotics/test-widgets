export interface ArmHome {
	/** The saved joint angles in degrees, or `undefined` when nothing valid is stored. */
	readonly jointDegrees: readonly number[] | undefined
	save(jointDegrees: readonly number[]): void
}

const isJointDegrees = (value: unknown): value is number[] =>
	Array.isArray(value) && value.length > 0 && value.every((entry) => Number.isFinite(entry))

const readStoredHome = (key: string): number[] | undefined => {
	const stored = localStorage.getItem(key)
	if (stored === null) return undefined
	try {
		const parsed: unknown = JSON.parse(stored)
		return isJointDegrees(parsed) ? parsed : undefined
	} catch {
		return undefined
	}
}

/**
 * One saved home per part and arm. Call it during component init.
 */
export const createArmHome = (getKey: () => { partID: string; resourceName: string }): ArmHome => {
	const key = $derived.by(() => {
		const { partID, resourceName } = getKey()
		return `${partID}/${resourceName}/arm-home`
	})
	// Not runed's PersistedState: it writes its initial value to an empty key, and the store must hold only a saved home.
	let stored = $derived(readStoredHome(key))

	return {
		get jointDegrees() {
			return stored
		},
		save(jointDegrees) {
			localStorage.setItem(key, JSON.stringify(jointDegrees))
			stored = [...jointDegrees]
		},
	}
}
