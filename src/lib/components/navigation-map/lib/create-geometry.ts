import { ViamObject3D } from '@viamrobotics/three'

import type { BoxGeometry, CapsuleGeometry, Geometry, Shapes, SphereGeometry } from '../types'

export const createGeometry = (type: Shapes, size = 5, rotation = 0): Geometry => {
	const pose = new ViamObject3D()
	pose.orientationVector.th = rotation

	switch (type) {
		case 'box': {
			return {
				type,
				length: size * 2,
				width: size * 2,
				height: size * 2,
				pose,
			} satisfies BoxGeometry
		}
		case 'sphere': {
			return {
				type,
				radius: size,
				pose,
			} satisfies SphereGeometry
		}
		case 'capsule': {
			return {
				type,
				radius: size / 2,
				length: size,
				pose,
			} satisfies CapsuleGeometry
		}
	}
}
