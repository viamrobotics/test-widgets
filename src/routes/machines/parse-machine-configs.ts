import type { MachineConfig, NamedMachineConfig } from './machine-config'

export const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

const isOptional = (value: unknown, type: 'string' | 'boolean') =>
	value === undefined || typeof value === type

export const isMachineConfig = (value: unknown): value is MachineConfig =>
	isRecord(value) &&
	typeof value.host === 'string' &&
	typeof value.partId === 'string' &&
	typeof value.signalingAddress === 'string' &&
	isOptional(value.serviceHost, 'string') &&
	isOptional(value.apiKeyId, 'string') &&
	isOptional(value.apiKeyValue, 'string') &&
	isOptional(value.disableSessions, 'boolean')

/** Accepts one config with a `name` field, or a record of name to config. All or nothing. */
export const parseMachineConfigs = (text: string): NamedMachineConfig[] | undefined => {
	let parsed: unknown
	try {
		parsed = JSON.parse(text)
	} catch {
		return undefined
	}
	if (!isRecord(parsed)) {
		return undefined
	}

	if (typeof parsed.name === 'string' && parsed.name !== '') {
		const { name } = parsed
		return isMachineConfig(parsed) ? [{ ...parsed, name }] : undefined
	}

	const entries = Object.entries(parsed)
	if (entries.length === 0) {
		return undefined
	}
	const configs: NamedMachineConfig[] = []
	for (const [name, config] of entries) {
		if (!isMachineConfig(config)) {
			return undefined
		}
		configs.push({ ...config, name })
	}
	return configs
}
