export type JointLimit = {
	minDegrees: number
	maxDegrees: number
}

export type OutOfBoundsSide = 'below-min' | 'above-max'

export const isOutsideJointLimit = (value: number, min: number, max: number): boolean =>
	value < min || value > max

export const getOutOfBoundsSide = (
	value: number,
	min: number,
	max: number
): OutOfBoundsSide | null => {
	if (value < min) {
		return 'below-min'
	}
	if (value > max) {
		return 'above-max'
	}
	return null
}

export interface KinematicsJSON {
	kinematic_param_type: string
}

interface SVAKinematicsJSON extends KinematicsJSON {
	kinematic_param_type: 'SVA'
	joints: {
		min: number
		max: number
	}[]
}

export const getJointPositionLimits = (kinematics: KinematicsJSON): JointLimit[] => {
	if (kinematics.kinematic_param_type === 'SVA') {
		return parseSVAKinematics(kinematics as SVAKinematicsJSON)
	}
	return []
}

const parseSVAKinematics = (kinematics: SVAKinematicsJSON): JointLimit[] => {
	const joints = kinematics.joints
	const limits = joints.map((joint: { min: number; max: number }) => {
		return {
			minDegrees: joint.min,
			maxDegrees: joint.max,
		}
	})
	return limits
}
