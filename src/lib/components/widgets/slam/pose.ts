import type { Pose } from '@viamrobotics/sdk'

export type PosePosition = Pick<Pose, 'x' | 'y' | 'z'>
