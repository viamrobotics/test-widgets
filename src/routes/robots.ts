import type { DialWebRTCConf } from '@viamrobotics/sdk'

import { parseMachineConfigs } from './machines/parse-machine-configs'

export type PlaygroundRobotsConfig = Record<
	string,
	{
		host: string
		serviceHost?: string
		partId: string
		apiKeyId?: string
		apiKeyValue?: string
		signalingAddress: string
		disableSessions?: boolean
	}
>

export const loadRobots = (): PlaygroundRobotsConfig => {
	const rawRobots = import.meta.env.VITE_PLAYGROUND_ROBOTS
	if (!rawRobots) {
		return {}
	}
	const configs = parseMachineConfigs(rawRobots)
	if (!configs) {
		throw new Error(
			'Cannot parse VITE_PLAYGROUND_ROBOTS. Please read the README.md playground section for more info'
		)
	}
	return Object.fromEntries(configs.map(({ name, ...config }) => [name, config]))
}

export const getDialConfs = (robots: PlaygroundRobotsConfig): Record<string, DialWebRTCConf> =>
	Object.fromEntries(Object.values(robots).map((robot) => [robot.partId, getDialConf(robot)]))

export const getDialConf = (robot: PlaygroundRobotsConfig[string]): DialWebRTCConf =>
	robot.apiKeyId && robot.apiKeyValue
		? {
				host: robot.host,
				serviceHost: robot.serviceHost ?? robot.host,
				credentials: {
					type: 'api-key',
					payload: robot.apiKeyValue,
					authEntity: robot.apiKeyId,
				},
				signalingAddress: robot.signalingAddress,
				disableSessions: Boolean(robot.disableSessions),
			}
		: {
				host: robot.host,
				serviceHost: robot.serviceHost ?? robot.host,
				signalingAddress: robot.signalingAddress,
				disableSessions: Boolean(robot.disableSessions),
			}
