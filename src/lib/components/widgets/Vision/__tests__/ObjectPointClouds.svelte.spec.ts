import '../../../../../app.css'
import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { traits } from '@viamrobotics/visualization'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../ObjectPointClouds.svelte'
import {
	objectWithBoxAndSphere,
	objectWithMissingValues,
} from './__fixtures__/object-point-clouds.ts'

// The visualizer parses each cloud in a worker and compiles its shaders before the first frame.
const SCENE_WIDTH = '160px'
const SCENE_POLL = { timeout: 8000 }

const LABEL = 'GetObjectPointClouds'
const OBJECTS = [objectWithBoxAndSphere, objectWithMissingValues]

interface DebugEntity {
	get: (trait: typeof traits.Name) => unknown
	has: (trait: typeof traits.Invisible) => boolean
}

interface DebugWorld {
	query: (trait: typeof traits.Name) => DebugEntity[]
}

const isDebugWorld = (value: unknown): value is DebugWorld =>
	typeof value === 'object' && value !== null && 'query' in value

/** The names of the scene's entities, read from the world the visualizer exposes for debugging. */
const sceneNames = (filter: (entity: DebugEntity) => boolean = () => true) => {
	const debug: unknown = Reflect.get(globalThis, '__koota__')
	const world: unknown =
		typeof debug === 'object' && debug !== null ? Reflect.get(debug, 'world') : undefined
	if (!isDebugWorld(world)) return []
	return world
		.query(traits.Name)
		.filter((entity) => filter(entity))
		.map((entity) => String(entity.get(traits.Name)))
		.filter((name) => name.startsWith('Object ') || name === 'Camera point cloud')
		.toSorted()
}

const hiddenNames = () => sceneNames((entity) => entity.has(traits.Invisible))

const ALL_NAMES = [
	'Object 1 ball',
	'Object 1 crate',
	'Object 1 point cloud',
	'Object 2 bare',
	'Object 2 point cloud',
]

const pickView = async (name: string) => {
	await userEvent.click(screen.getByRole('combobox', { name: 'View' }))
	await userEvent.click(await screen.findByRole('option', { name }))
}

describe('<ObjectPointClouds>', () => {
	beforeEach(() => {
		document.body.style.width = SCENE_WIDTH
	})

	afterEach(() => {
		document.body.style.width = ''
	})

	it('lists each object with its point count and geometry folders below the scene', () => {
		render(Subject, { props: { objects: OBJECTS, label: LABEL } })

		const list = screen.getByRole('list', { name: 'Objects' })
		expect(within(list).getByRole('group', { name: 'Object 1' }).textContent).toMatch(/4\s*points/u)
		expect(within(list).getByRole('button', { name: 'crate (box)' })).toBeInTheDocument()
		expect(within(list).getByRole('button', { name: 'bare (box)' })).toBeInTheDocument()
		expect(within(list).queryByRole('button', { name: /^Preview/u })).not.toBeInTheDocument()
	})

	it("draws every object's cloud and geometries in one scene", async () => {
		const { baseElement } = render(Subject, { props: { objects: OBJECTS, label: LABEL } })

		await vi.waitFor(() => expect(sceneNames()).toEqual(ALL_NAMES), SCENE_POLL)
		expect(hiddenNames()).toEqual([])
		expect(baseElement.querySelectorAll('canvas')).toHaveLength(1)
	})

	it('hides the other objects when one is picked in View, and shows them again on All objects', async () => {
		render(Subject, { props: { objects: OBJECTS, label: LABEL } })
		await vi.waitFor(() => expect(sceneNames()).toEqual(ALL_NAMES), SCENE_POLL)

		await pickView('Object 2')

		await vi.waitFor(() =>
			expect(hiddenNames()).toEqual(['Object 1 ball', 'Object 1 crate', 'Object 1 point cloud'])
		)

		await pickView('All objects')

		await vi.waitFor(() => expect(hiddenNames()).toEqual([]))
	})

	it("draws the camera's cloud behind the objects and hides it while one object is in focus", async () => {
		render(Subject, {
			props: { objects: OBJECTS, backdrop: objectWithBoxAndSphere.pointCloud, label: LABEL },
		})
		await vi.waitFor(
			() => expect(sceneNames()).toEqual(['Camera point cloud', ...ALL_NAMES]),
			SCENE_POLL
		)

		await pickView('Object 1')

		await vi.waitFor(() =>
			expect(hiddenNames()).toEqual(['Camera point cloud', 'Object 2 bare', 'Object 2 point cloud'])
		)
	})

	it('says the service returned no objects, with no scene and no View select', () => {
		const { baseElement } = render(Subject, { props: { objects: [], label: LABEL } })

		expect(screen.getByText('The service returned no objects.')).toBeInTheDocument()
		expect(screen.queryByRole('combobox', { name: 'View' })).not.toBeInTheDocument()
		expect(baseElement.querySelector('canvas')).toBeNull()
	})

	it('shows the splash and draws no scene until started', async () => {
		const onStart = vi.fn()
		const { baseElement } = render(Subject, {
			props: {
				objects: OBJECTS,
				label: LABEL,
				running: false,
				onStart,
				startLabel: 'Start object point clouds',
			},
		})

		expect(baseElement.querySelector('canvas')).toBeNull()
		await userEvent.click(screen.getByRole('button', { name: 'Start object point clouds' }))

		expect(onStart).toHaveBeenCalledOnce()
	})
})
