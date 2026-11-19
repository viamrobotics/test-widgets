import { navigationApi } from '@viamrobotics/sdk'

const MISSING_LABEL = '-'

const MODES = [
	{ label: 'Manual', mode: navigationApi.Mode.MANUAL },
	{ label: 'Waypoint', mode: navigationApi.Mode.WAYPOINT },
	{ label: 'Explore', mode: navigationApi.Mode.EXPLORE },
]

/** The modes a caller can set, in display order. */
export const MODE_LABELS = MODES.map(({ label }) => label)

/** The label for a navigation mode, or `-` when it is unspecified or unknown. */
export const modeLabel = (mode: navigationApi.Mode | undefined): string =>
	MODES.find((entry) => entry.mode === mode)?.label ?? MISSING_LABEL

/** The navigation mode for a label from `MODE_LABELS`, or `undefined` for any other text. */
export const modeFromLabel = (label: string | undefined): navigationApi.Mode | undefined =>
	MODES.find((entry) => entry.label === label)?.mode
