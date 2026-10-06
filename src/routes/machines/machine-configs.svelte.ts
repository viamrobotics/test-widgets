import { PersistedState } from 'runed'

import type { PlaygroundRobotsConfig } from '../robots'
import type { MachineConfigs, NamedMachineConfig } from './machine-config'

import { isMachineConfig, isRecord } from './parse-machine-configs'

const STORAGE_KEY = 'test-widgets:machines'

export const createMachineConfigs = (envConfigs: PlaygroundRobotsConfig): MachineConfigs => {
	const stored = new PersistedState<PlaygroundRobotsConfig>(STORAGE_KEY, {})

	const storedConfigs = (): PlaygroundRobotsConfig =>
		isRecord(stored.current) ? stored.current : {}

	const isEnvConfig = (name: string) => Object.hasOwn(envConfigs, name)

	const current = $derived.by<NamedMachineConfig[]>(() => {
		const env = Object.entries(envConfigs).map(([name, config]) => ({ ...config, name }))
		const extra = Object.entries(storedConfigs())
			.filter(([name, config]) => !isEnvConfig(name) && isMachineConfig(config))
			.map(([name, config]) => ({ ...config, name }))
		return [...env, ...extra]
	})

	return {
		get current() {
			return current
		},
		add: (configs) => {
			const next = { ...storedConfigs() }
			for (const { name, ...config } of configs) {
				if (!isEnvConfig(name)) {
					next[name] = config
				}
			}
			stored.current = next
		},
		remove: (name) => {
			const existing = storedConfigs()
			if (isEnvConfig(name) || !Object.hasOwn(existing, name)) {
				return
			}
			stored.current = Object.fromEntries(Object.entries(existing).filter(([key]) => key !== name))
		},
		isEnvConfig,
	}
}
