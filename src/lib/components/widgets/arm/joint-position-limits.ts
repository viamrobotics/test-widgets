export type JointLimit = {
    minDegrees: number
    maxDegrees: number
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
	const limits = joints.map((joint: { min: number, max: number }) => {
		return {
			minDegrees: joint.min,
			maxDegrees: joint.max,
		}
	})
	return limits
}