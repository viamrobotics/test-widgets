import { describe, expect, it } from 'vitest'

const SOURCES: Record<string, string> = import.meta.glob('/src/lib/**/*.{ts,svelte}', {
	query: '?raw',
	import: 'default',
	eager: true,
})

const MAIN_ENTRY = '/src/lib/index.ts'
const REGISTRY_ENTRY = '/src/lib/registry.ts'
const ARM_SCENE_ENTRY = '/src/lib/components/widgets/arm/arm-scene/index.ts'
const ARM_SCENE_DIRECTORY = '/src/lib/components/widgets/arm/arm-scene/'
const VISUALIZATION_PACKAGE = '@viamrobotics/visualization'
const LIB_ALIAS = '$lib/'
const LIB_ROOT = '/src/lib/'
const RESOLVED_SUFFIXES = ['', '.ts', '.svelte', '.svelte.ts', '/index.ts']
const ASSET_EXTENSION = /\.(css|json|svg|png|txt|hdr|glb|wasm)$/

const STATIC_IMPORT = /\b(?:import|export)\s+(?:type\s+)?(?:[^'"`;]*?\s+from\s+)?['"]([^'"]+)['"]/g
const DYNAMIC_IMPORT = /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g

const importSpecifiers = (source: string): string[] =>
	[...source.matchAll(STATIC_IMPORT), ...source.matchAll(DYNAMIC_IMPORT)].map(
		([, specifier]) => specifier.split('?')[0]
	)

const isLocal = (specifier: string) =>
	specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith(LIB_ALIAS)

const joinPath = (directory: string, relative: string): string => {
	const segments = directory.split('/')
	for (const segment of relative.split('/')) {
		if (segment === '..') segments.pop()
		else if (segment !== '.') segments.push(segment)
	}
	return segments.join('/')
}

const resolveLocal = (importer: string, specifier: string): string | undefined => {
	const base = specifier.startsWith(LIB_ALIAS)
		? `${LIB_ROOT}${specifier.slice(LIB_ALIAS.length)}`
		: joinPath(importer.slice(0, importer.lastIndexOf('/')), specifier)
	return RESOLVED_SUFFIXES.map((suffix) => `${base}${suffix}`).find((path) => path in SOURCES)
}

interface ImportGraph {
	files: Set<string>
	packageImports: { importer: string; specifier: string }[]
	unresolved: { importer: string; specifier: string }[]
}

const walkImports = (entries: string[]): ImportGraph => {
	const graph: ImportGraph = { files: new Set(), packageImports: [], unresolved: [] }
	const pending = [...entries]
	for (let file = pending.pop(); file !== undefined; file = pending.pop()) {
		if (graph.files.has(file)) continue
		graph.files.add(file)
		for (const specifier of importSpecifiers(SOURCES[file] ?? '')) {
			if (!isLocal(specifier)) {
				graph.packageImports.push({ importer: file, specifier })
				continue
			}
			const resolved = resolveLocal(file, specifier)
			if (resolved !== undefined) pending.push(resolved)
			else if (!ASSET_EXTENSION.test(specifier))
				graph.unresolved.push({ importer: file, specifier })
		}
	}
	return graph
}

const visualizationImports = (graph: ImportGraph) =>
	graph.packageImports.filter(({ specifier }) => specifier.startsWith(VISUALIZATION_PACKAGE))

describe('the main and registry entries', () => {
	const graph = walkImports([MAIN_ENTRY, REGISTRY_ENTRY])

	it('resolve every local import they reach', () => {
		expect(graph.files.has(MAIN_ENTRY), 'the glob read the main entry').toBe(true)
		expect(graph.unresolved).toEqual([])
	})

	it('reach the arm controls, so the walk follows the barrel down to the widgets', () => {
		expect(graph.files.has('/src/lib/components/widgets/arm/arm-controls.svelte')).toBe(true)
	})

	it('import nothing from @viamrobotics/visualization', () => {
		expect(visualizationImports(graph)).toEqual([])
	})

	it('reach no file of the arm scene subpath', () => {
		expect([...graph.files].filter((file) => file.startsWith(ARM_SCENE_DIRECTORY))).toEqual([])
	})
})

describe('the arm scene entry', () => {
	it('reaches @viamrobotics/visualization, so the walk can find what the main entry must not', () => {
		const graph = walkImports([ARM_SCENE_ENTRY])

		expect(visualizationImports(graph)).toContainEqual({
			importer: '/src/lib/components/widgets/arm/arm-scene/arm-scene.svelte',
			specifier: '@viamrobotics/visualization/scoped-scene',
		})
	})
})
