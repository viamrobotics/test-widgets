import { Quaternion } from 'three'

import {
	type OrientationVector,
	orientationVectorToQuaternion,
} from '$lib/orientation-vector-quaternion'

/** The angle in radians of the shortest rotation from one orientation to another. */
export const turnBetween = (from: OrientationVector, to: OrientationVector): number => {
	const fromQuaternion = orientationVectorToQuaternion(from, new Quaternion())
	const toQuaternion = orientationVectorToQuaternion(to, new Quaternion())
	return 2 * Math.acos(Math.min(1, Math.abs(fromQuaternion.dot(toQuaternion))))
}
