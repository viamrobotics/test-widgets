import type { appRobotApi } from '@viamrobotics/sdk'

export interface DiscoveredResource {
	name: string
	api: string
	model: string
	variants: appRobotApi.ComponentConfig[]
}

interface IndexedConfig {
	config: appRobotApi.ComponentConfig
	prefix: string
	index: number
}

const MIN_GROUP_SIZE = 2

const TRAILING_INDEX = /^(.*?)(\d+)$/
const STEM_SUFFIX = /(?:[-_]url|[-_])$/

const parseTrailingIndex = (config: appRobotApi.ComponentConfig): IndexedConfig | undefined => {
	const match = TRAILING_INDEX.exec(config.name)
	const prefix = match?.[1]
	const digits = match?.[2]
	if (prefix === undefined || digits === undefined || prefix === '') return undefined

	const index = Number(digits)
	if (String(index) !== digits) return undefined
	return { config, prefix, index }
}

const toStandaloneResource = (config: appRobotApi.ComponentConfig): DiscoveredResource => ({
	name: config.name,
	api: config.api,
	model: config.model,
	variants: [config],
})

/** Indexes must count 0, 1, 2 and so on with no gap. */
const countsFromZero = (members: IndexedConfig[]): boolean => {
	const indexes = new Set(members.map((member) => member.index))
	return indexes.size === members.length && members.every((_, index) => indexes.has(index))
}

/**
 * Groups configs that share an API and a model and whose names differ only in a trailing index
 * counting from 0, such as `-0` and `-1` or `-url0` and `-url1`. Every other config stands alone.
 * Output is sorted by name, and variants keep input order.
 */
export const groupDiscoveries = (configs: appRobotApi.ComponentConfig[]): DiscoveredResource[] => {
	const candidates = new Map<string, IndexedConfig[]>()
	for (const config of configs) {
		const indexed = parseTrailingIndex(config)
		if (indexed === undefined) continue
		const key = JSON.stringify([config.api, config.model, indexed.prefix])
		candidates.set(key, [...(candidates.get(key) ?? []), indexed])
	}

	const groupedKeys = new Set<string>()
	const resources: DiscoveredResource[] = []

	for (const [key, members] of candidates) {
		const [first] = members
		if (first === undefined || members.length < MIN_GROUP_SIZE || !countsFromZero(members)) continue
		groupedKeys.add(key)
		resources.push({
			name: first.prefix.replace(STEM_SUFFIX, ''),
			api: first.config.api,
			model: first.config.model,
			variants: members.map((member) => member.config),
		})
	}

	for (const config of configs) {
		const indexed = parseTrailingIndex(config)
		const key =
			indexed === undefined ? undefined : JSON.stringify([config.api, config.model, indexed.prefix])
		if (key === undefined || !groupedKeys.has(key)) resources.push(toStandaloneResource(config))
	}

	return resources.toSorted((a, b) => a.name.localeCompare(b.name))
}
