import type { ResourceName } from '@viamrobotics/sdk'

import { describe, expect, it } from 'vitest'

import { compositePane, entryPanes, resourcePaneMethod } from '../resource-pane'
import { resourcePaneMinimum } from '../resource-pane-minimums'

const SERVICE_SUBTYPES: ReadonlySet<string> = new Set(['motion', 'vision', 'navigation', 'slam'])

const resource = (subtype: string, name: string): ResourceName => ({
	namespace: 'rdk',
	type: SERVICE_SUBTYPES.has(subtype) ? 'service' : 'component',
	subtype,
	name,
})

const arm = resource('arm', 'arm-1')
const motor = resource('motor', 'motor-1')
const motion = resource('motion', 'motion-1')
const base = resource('base', 'base-1')
const gantry = resource('gantry', 'gantry-1')
const servo = resource('servo', 'servo-1')
const gripper = resource('gripper', 'gripper-1')
const board = resource('board', 'board-1')
const switchResource = resource('switch', 'switch-1')
const button = resource('button', 'button-1')
const sensor = resource('sensor', 'sensor-1')
const movementSensor = resource('movement_sensor', 'movement-sensor-1')
const powerSensor = resource('power_sensor', 'power-sensor-1')
const encoder = resource('encoder', 'encoder-1')
const inputController = resource('input_controller', 'input-controller-1')
const camera = resource('camera', 'camera-1')
const vision = resource('vision', 'vision-1')
const navigation = resource('navigation', 'navigation-1')
const slam = resource('slam', 'slam-1')

describe('Resource panes', () => {
	it("offers an arm's composite and its six entries", () => {
		expect(compositePane(arm)?.id).toBe('arm-1::composite')
		expect(entryPanes(arm).map(({ id }) => id)).toEqual([
			'arm-1::move-to-joint-positions',
			'arm-1::move-to-position',
			'arm-1::get-joint-positions',
			'arm-1::is-moving',
			'arm-1::manual-mode',
			'arm-1::stop',
		])
	})

	it('makes manual-mode the arm control and every other arm entry an api', () => {
		const kinds = Object.fromEntries(entryPanes(arm).map(({ id, data }) => [id, data.kind]))
		expect(Object.values(kinds).filter((kind) => kind === 'control')).toHaveLength(1)
		expect(kinds['arm-1::manual-mode']).toBe('control')
	})

	it('keeps quick-move the only motor control', () => {
		const controls = entryPanes(motor).filter(({ data }) => data.kind === 'control')
		expect(controls.map(({ id }) => id)).toEqual(['motor-1::quick-move'])
	})

	it.each([
		['base-1', base],
		['gantry-1', gantry],
		['servo-1', servo],
	])('offers %s a composite and makes quick-move its only control', (name, target) => {
		expect(compositePane(target)?.id).toBe(`${name}::composite`)
		const controls = entryPanes(target).filter(({ data }) => data.kind === 'control')
		expect(controls.map(({ id }) => id)).toEqual([`${name}::quick-move`])
	})

	it('makes open-grab the gripper control and open an api', () => {
		const kinds = Object.fromEntries(entryPanes(gripper).map(({ id, data }) => [id, data.kind]))
		expect(kinds['gripper-1::open-grab']).toBe('control')
		expect(kinds['gripper-1::open']).toBe('api')
		expect(Object.values(kinds).filter((kind) => kind === 'control')).toHaveLength(1)
	})

	it.each([
		['camera-1', camera],
		['vision-1', vision],
		['navigation-1', navigation],
		['slam-1', slam],
	])('makes controls the only control pane of %s and its other entries apis', (_name, target) => {
		const panes = entryPanes(target)
		expect(panes.length).toBeGreaterThan(1)
		for (const { id, data } of panes) {
			expect(data.kind, id).toBe(id.endsWith('::controls') ? 'control' : 'api')
		}
		expect(panes.filter(({ data }) => data.kind === 'control')).toHaveLength(1)
	})

	it.each([
		['board-1', board],
		['switch-1', switchResource],
		['button-1', button],
		['sensor-1', sensor],
		['input-controller-1', inputController],
	])('offers %s a composite and no entries', (name, target) => {
		expect(compositePane(target)?.id).toBe(`${name}::composite`)
		expect(entryPanes(target)).toEqual([])
	})

	it.each([
		[
			'movement-sensor-1',
			movementSensor,
			['get-position', 'get-orientation', 'get-compass-heading', 'get-accuracy'],
		],
		['power-sensor-1', powerSensor, ['get-voltage', 'get-current', 'get-power']],
		['encoder-1', encoder, ['get-position']],
	])('offers %s a composite and its api entries, with no control', (name, target, ids) => {
		expect(compositePane(target)?.id).toBe(`${name}::composite`)
		expect(entryPanes(target).map(({ id }) => id)).toEqual(ids.map((id) => `${name}::${id}`))
		expect(entryPanes(target).filter(({ data }) => data.kind === 'control')).toEqual([])
	})

	it('titles manual-mode with the resource alone and an api pane with its method', () => {
		const panes = entryPanes(arm)
		const manualMode = panes.find(({ id }) => id.endsWith('::manual-mode'))
		const moveToPosition = panes.find(({ id }) => id.endsWith('::move-to-position'))
		expect(manualMode && resourcePaneMethod(manualMode.data)).toBeUndefined()
		expect(moveToPosition && resourcePaneMethod(moveToPosition.data)).toBe('MoveToPosition')
	})

	it('offers motion its composite only', () => {
		expect(compositePane(motion)?.id).toBe('motion-1::composite')
		expect(entryPanes(motion)).toEqual([])
	})

	it.each([
		['navigation-1::controls', navigation],
		['slam-1::controls', slam],
	])('makes %s a control pane', (id, target) => {
		const pane = entryPanes(target).find((candidate) => candidate.id === id)
		expect(pane?.data.kind).toBe('control')
	})

	it.each([
		[
			'navigation-1',
			navigation,
			[
				'controls',
				'get-mode',
				'set-mode',
				'get-location',
				'get-waypoints',
				'add-waypoint',
				'remove-waypoint',
				'get-obstacles',
			],
		],
		['slam-1', slam, ['controls', 'get-position', 'get-point-cloud-map', 'get-properties']],
	])('offers %s a composite and its entries in registry order', (name, target, ids) => {
		expect(compositePane(target)?.id).toBe(`${name}::composite`)
		expect(entryPanes(target).map(({ id }) => id)).toEqual(ids.map((id) => `${name}::${id}`))
	})

	it.each([
		['arm-1::composite', 246, 2300],
		['arm-1::move-to-joint-positions', 230, 575],
		['arm-1::move-to-position', 230, 800],
		['arm-1::get-joint-positions', 180, 296],
		['arm-1::is-moving', 162, 73],
		['arm-1::manual-mode', 200, 186],
		['arm-1::stop', 162, 85],
		['motion-1::composite', 220, 600],
		['motor-1::composite', 228, 1260],
		['motor-1::go-to', 212, 137],
		['base-1::composite', 286, 1120],
		['base-1::quick-move', 286, 237],
		['base-1::move-straight', 180, 137],
		['base-1::spin', 218, 137],
		['base-1::set-power', 248, 201],
		['base-1::set-velocity', 270, 201],
		['base-1::is-moving', 162, 73],
		['base-1::stop', 162, 85],
		['gantry-1::composite', 200, 1300],
		['gantry-1::get-position', 162, 277],
		['gantry-1::move-to-position', 164, 509],
		['gantry-1::home', 162, 167],
		['gantry-1::is-moving', 162, 73],
		['gantry-1::quick-move', 181, 155],
		['servo-1::composite', 178, 410],
		['servo-1::move', 178, 139],
		['servo-1::get-position', 162, 97],
		['servo-1::is-moving', 162, 73],
		['servo-1::stop', 162, 85],
		['servo-1::quick-move', 162, 75],
		['gripper-1::composite', 240, 207],
		['gripper-1::open-grab', 190, 94],
		['gripper-1::is-holding-something', 196, 99],
		['gripper-1::is-moving', 162, 99],
		['gripper-1::open', 162, 96],
		['gripper-1::grab', 162, 142],
		['gripper-1::stop', 162, 104],
		['board-1::composite', 210, 236],
		['switch-1::composite', 147, 105],
		['button-1::composite', 162, 92],
		['sensor-1::composite', 261, 399],
		['movement-sensor-1::composite', 241, 1220],
		['movement-sensor-1::get-position', 208, 193],
		['movement-sensor-1::get-orientation', 152, 161],
		['movement-sensor-1::get-compass-heading', 211, 131],
		['movement-sensor-1::get-accuracy', 185, 227],
		['power-sensor-1::composite', 213, 453],
		['power-sensor-1::get-voltage', 197, 125],
		['power-sensor-1::get-current', 189, 125],
		['power-sensor-1::get-power', 178, 125],
		['encoder-1::composite', 213, 319],
		['encoder-1::get-position', 164, 125],
		['input-controller-1::composite', 213, 387],
		['navigation-1::composite', 118, 1225],
		['navigation-1::controls', 250, 428],
		['navigation-1::get-mode', 152, 111],
		['navigation-1::set-mode', 250, 121],
		['navigation-1::get-location', 152, 215],
		['navigation-1::get-waypoints', 152, 135],
		['navigation-1::add-waypoint', 259, 153],
		['navigation-1::remove-waypoint', 182, 143],
		['navigation-1::get-obstacles', 234, 325],
		['slam-1::composite', 225, 751],
		['slam-1::controls', 250, 589],
		['slam-1::get-position', 225, 351],
		['slam-1::get-point-cloud-map', 167, 145],
		['slam-1::get-properties', 246, 241],
	])("snaps %s to its board's minimum", (id, width, height) => {
		const pane = [
			compositePane(arm),
			compositePane(motion),
			compositePane(motor),
			compositePane(base),
			compositePane(gantry),
			compositePane(servo),
			compositePane(gripper),
			compositePane(board),
			compositePane(switchResource),
			compositePane(button),
			compositePane(sensor),
			compositePane(movementSensor),
			compositePane(powerSensor),
			compositePane(encoder),
			compositePane(inputController),
			...entryPanes(arm),
			...entryPanes(motor),
			...entryPanes(base),
			...entryPanes(gantry),
			...entryPanes(servo),
			...entryPanes(gripper),
			...entryPanes(movementSensor),
			...entryPanes(powerSensor),
			...entryPanes(encoder),
			compositePane(navigation),
			...entryPanes(navigation),
			compositePane(slam),
			...entryPanes(slam),
		].find((candidate) => candidate?.id === id)
		expect(pane && resourcePaneMinimum(pane.data)).toEqual({ width, height })
	})
})
