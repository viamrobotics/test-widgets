import type { Pose } from '@viamrobotics/sdk'

import type { EulerAngle } from './euler-field-status'

export const POSITION_FIELDS: { key: keyof Pose; label: string }[] = [
	{ key: 'x', label: 'X' },
	{ key: 'y', label: 'Y' },
	{ key: 'z', label: 'Z' },
]

export const ORIENTATION_FIELDS: { key: keyof Pose; label: string }[] = [
	{ key: 'oX', label: 'OX' },
	{ key: 'oY', label: 'OY' },
	{ key: 'oZ', label: 'OZ' },
]

export const ROW_CLASS = 'flex flex-col gap-2 @sm:flex-row @sm:flex-wrap @sm:gap-1.5'

export const MILLIMETER_STEP = 0.1
export const DEGREE_STEP = 0.1
export const RADIAN_STEP = 0.001
export const ORIENTATION_VECTOR_STEP = 0.001
export const ORIENTATION_VECTOR_DECIMALS = 3

export const EULER_FIELDS: { angle: EulerAngle; label: string }[] = [
	{ angle: 'roll', label: 'Roll' },
	{ angle: 'pitch', label: 'Pitch' },
	{ angle: 'yaw', label: 'Yaw' },
]

export const ORIENTATION_RESET_KEYS = ['oX', 'oY', 'oZ', 'theta'] as const
export const GIMBAL_HINT =
	'At pitch 90°, roll and yaw turn about the same axis. Use Vector to edit this orientation.'
