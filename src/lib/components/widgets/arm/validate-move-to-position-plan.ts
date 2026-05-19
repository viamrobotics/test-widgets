import { motionApi, type MotionClient, type Pose, PoseInFrame } from '@viamrobotics/sdk'

/** DoCommand key for the builtin motion service plan-only path. */
export const MOTION_DO_PLAN_COMMAND = 'plan'

export const DEFAULT_MOTION_SERVICE_NAME = 'builtin'

export function buildPlanMoveRequestJson(
	motionServiceName: string,
	componentName: string,
	pose: Pose
): string {
	return new motionApi.MoveRequest({
		name: motionServiceName,
		componentName,
		destination: new PoseInFrame({
			referenceFrame: 'world',
			pose,
		}),
	}).toJsonString()
}

/** Returns when a plan exists; throws when the target pose cannot be reached. */
export async function validateMoveToPositionPlan(
	motionClient: MotionClient,
	motionServiceName: string,
	componentName: string,
	pose: Pose
): Promise<void> {
	try {
		await motionClient.doCommand({
			[MOTION_DO_PLAN_COMMAND]: buildPlanMoveRequestJson(motionServiceName, componentName, pose),
		})
	} catch (error) {
		if (error instanceof Error && error.message.includes('not found in robot frame system')) {
			// swallow this error if the arm is not in the frame system yet
			return
		}
		throw error
	}
}
