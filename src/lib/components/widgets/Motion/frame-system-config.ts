/** The subset of a `FrameSystemConfig` entry these helpers read. */
export interface FrameConfigEntry {
	frame?: {
		referenceFrame?: string
		poseInObserverFrame?: { referenceFrame?: string }
	}
}

/**
 * The components the motion service can `Move` are exactly the frames in the
 * machine's frame system config. `Move` builds a kinematic chain to a frame, so
 * anything with a configured frame is a valid target.
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

/**
 * The parent frame a frame is attached to in the machine's frame system. A
 * frame's parent is the reference frame of the pose that positions it (its
 * observer frame), so `getPose` and `Move` can be expressed relative to it.
 *
 * @param config - The machine's frame system config, or `undefined` while loading.
 * @param frameName - The frame whose parent to look up.
 * @returns The parent frame name, or `'world'` when there is no configured parent.
 */
export const parentFrame = (config: FrameConfigEntry[] | undefined, frameName: string): string => {
	const entry = config?.find((item) => item.frame?.referenceFrame === frameName)
	return entry?.frame?.poseInObserverFrame?.referenceFrame || 'world'
}

/**
 * The reference frames a destination pose can be expressed in: the root
 * `'world'` frame first, then every frame in the machine's frame system
 * (already sorted alphabetically by `movableFrameNames`).
 *
 * @param config - The machine's frame system config, or `undefined` while loading.
 * @returns The selectable reference frame names, always led by `'world'`.
 */
export const referenceFrameNames = (config: FrameConfigEntry[] | undefined): string[] => {
	const frames = movableFrameNames(config).filter((name) => name !== 'world')
	return ['world', ...frames]
}
