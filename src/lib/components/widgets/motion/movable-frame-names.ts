/** The subset of a `FrameSystemConfig` entry this module reads. */
interface FrameConfigEntry {
	frame?: { referenceFrame?: string }
}

/**
 * The components the motion service can `Move` are exactly the frames in the
 * machine's frame system config. `Move` builds a kinematic chain to a frame, so anything with a configured frame
 * is a valid target.
 *
 * @param config - The machine's frame system config, or `undefined` while loading.
 * @returns The non-empty reference frame names, sorted alphabetically.
 */
export const movableFrameNames = (config: FrameConfigEntry[] | undefined): string[] => {
	if (!config) {
		return []
	}

	return config
		.map((entry) => entry.frame?.referenceFrame ?? '')
		.filter((name) => name !== '')
		.toSorted((a, b) => a.localeCompare(b))
}
