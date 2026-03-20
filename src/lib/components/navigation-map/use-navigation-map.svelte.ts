import { getContext, setContext } from 'svelte'

import type { Waypoint } from '../maplibre/types'
import type { NavigationTabType, Obstacle, Path } from './types'

const CONTEXT_KEY = 'navigation-map-context'

export type Environments = 'debug' | 'configure'

export interface NavigationMapContext {
	tab: NavigationTabType
	tabs: NavigationTabType[]
	waypoints: Waypoint[]
	obstacles: Obstacle[]
	paths: Path[]
	environment: Environments
	hovered: string | undefined
	selected: string | undefined
	view: '2D' | '3D'
	boundingRadius: Record<string, number>
}

export const provideNavigationMapContext = (
	tab: () => NavigationTabType,
	tabs: () => NavigationTabType[],
	waypoints: () => Waypoint[],
	paths: () => Path[],
	environment: () => Environments
) => {
	let obstacles = $state<Obstacle[]>([])
	let currentTab = $state(tab())
	let hovered = $state<string>()
	let selected = $state<string>()
	let view = $state<'2D' | '3D'>('2D')
	let boundingRadius = $state<Record<string, number>>({})

	const context: NavigationMapContext = {
		get tab() {
			return currentTab
		},
		set tab(value: NavigationTabType) {
			currentTab = value
		},

		get tabs() {
			return tabs()
		},
		get waypoints() {
			return waypoints()
		},
		get paths() {
			return paths()
		},
		get environment() {
			return environment()
		},

		get hovered() {
			return hovered
		},
		set hovered(value: string | undefined) {
			hovered = value
		},

		get selected() {
			return selected
		},
		set selected(value: string | undefined) {
			selected = value
		},

		get obstacles() {
			return obstacles
		},
		set obstacles(value: Obstacle[]) {
			obstacles = value
		},

		get view() {
			return view
		},
		set view(value: '2D' | '3D') {
			view = value
		},

		get boundingRadius() {
			return boundingRadius
		},
		set boundingRadius(value: Record<string, number>) {
			boundingRadius = value
		},
	}

	setContext<NavigationMapContext>(CONTEXT_KEY, context)

	return context
}

export const useNavigationMap = () => {
	const context = getContext<NavigationMapContext>(CONTEXT_KEY)
	if (!context) {
		throw new Error('NavigationMapContext not found')
	}

	return context
}
