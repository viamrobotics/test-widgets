import type { PlaygroundRobotsConfig } from '../robots'

export type MachineConfig = PlaygroundRobotsConfig[string]

export interface NamedMachineConfig extends MachineConfig {
	name: string
}

export interface MachineConfigs {
	readonly current: NamedMachineConfig[]
	add: (configs: NamedMachineConfig[]) => void
	remove: (name: string) => void
	isEnvConfig: (name: string) => boolean
}
