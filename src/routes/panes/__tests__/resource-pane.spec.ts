import type { ResourceName } from '@viamrobotics/sdk'

import { describe, expect, it } from 'vitest'

import { compositePane, entryPanes, resourcePaneMethod } from '../resource-pane'
import { resourcePaneMinimum } from '../resource-pane-minimums'

const SERVICE_SUBTYPES: ReadonlySet<string> = new Set([
	'motion',
	'vision',
	'navigation',
	'slam',
	'discovery',
	'mlmodel',
])

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
const audioInput = resource('audio_in', 'audio-input-1')
const audioOutput = resource('audio_out', 'audio-output-1')
const discovery = resource('discovery', 'discovery-1')
const mlModel = resource('mlmodel', 'ml-model-1')

describe('Resource panes', () => {
	it("offers an arm's composite and its thirteen entries", () => {
		expect(compositePane(arm)?.id).toBe('arm-1::composite')
		expect(entryPanes(arm).map(({ id }) => id)).toEqual([
			'arm-1::controls',
			'arm-1::jog',
			'arm-1::joints',
			'arm-1::move-to-joint-positions',
			'arm-1::move-to-position',
			'arm-1::get-joint-positions',
			'arm-1::get-end-position',
			'arm-1::is-moving',
			'arm-1::manual-mode',
			'arm-1::set-manual-mode',
			'arm-1::get-manual-mode',
			'arm-1::get-properties',
			'arm-1::stop',
		])
	})

	it('makes controls, jog, joints, and manual-mode the arm controls and every other arm entry an api', () => {
		const kinds = Object.fromEntries(entryPanes(arm).map(({ id, data }) => [id, data.kind]))
		expect(Object.values(kinds).filter((kind) => kind === 'control')).toHaveLength(4)
		expect(kinds['arm-1::controls']).toBe('control')
		expect(kinds['arm-1::jog']).toBe('control')
		expect(kinds['arm-1::joints']).toBe('control')
		expect(kinds['arm-1::manual-mode']).toBe('control')
	})

	it('makes controls, quick-move, and move the motor controls', () => {
		const controls = entryPanes(motor).filter(({ data }) => data.kind === 'control')
		expect(controls.map(({ id }) => id)).toEqual([
			'motor-1::controls',
			'motor-1::quick-move',
			'motor-1::move',
		])
	})

	it('offers base-1 a composite and makes controls and quick-move its controls', () => {
		expect(compositePane(base)?.id).toBe('base-1::composite')
		const controls = entryPanes(base).filter(({ data }) => data.kind === 'control')
		expect(controls.map(({ id }) => id)).toEqual(['base-1::controls', 'base-1::quick-move'])
	})

	it.each([
		['gantry-1', gantry, ['controls', 'quick-move']],
		['servo-1', servo, ['controls', 'quick-move', 'move-to']],
		['gripper-1', gripper, ['controls', 'open-grab']],
		['switch-1', switchResource, ['controls']],
		['encoder-1', encoder, ['controls']],
		['movement-sensor-1', movementSensor, ['controls']],
		['power-sensor-1', powerSensor, ['controls']],
	])('offers %s a composite and makes %j its controls', (name, target, ids) => {
		expect(compositePane(target)?.id).toBe(`${name}::composite`)
		const controls = entryPanes(target).filter(({ data }) => data.kind === 'control')
		expect(controls.map(({ id }) => id)).toEqual(ids.map((id) => `${name}::${id}`))
	})

	it('makes open an api of gripper-1', () => {
		const kinds = Object.fromEntries(entryPanes(gripper).map(({ id, data }) => [id, data.kind]))
		expect(kinds['gripper-1::open']).toBe('api')
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
		['button-1', button],
		['sensor-1', sensor],
	])('offers %s a composite and no entries', (name, target) => {
		expect(compositePane(target)?.id).toBe(`${name}::composite`)
		expect(entryPanes(target)).toEqual([])
	})

	it.each([['input-controller-1', inputController, ['get-events', 'trigger-event']]])(
		'offers %s a composite and its api entries, with no control',
		(name, target, ids) => {
			expect(compositePane(target)?.id).toBe(`${name}::composite`)
			expect(entryPanes(target).map(({ id }) => id)).toEqual(ids.map((id) => `${name}::${id}`))
			expect(entryPanes(target).filter(({ data }) => data.kind === 'control')).toEqual([])
		}
	)

	it('titles manual-mode with the resource alone and an api pane with its method', () => {
		const panes = entryPanes(arm)
		const manualMode = panes.find(({ id }) => id.endsWith('::manual-mode'))
		const moveToPosition = panes.find(({ id }) => id.endsWith('::move-to-position'))
		expect(manualMode && resourcePaneMethod(manualMode.data)).toBeUndefined()
		expect(moveToPosition && resourcePaneMethod(moveToPosition.data)).toBe('MoveToPosition')
	})

	it('makes metadata and infer api panes and no pane of ml-model-1 a control', () => {
		expect(entryPanes(mlModel).map(({ data }) => data.kind)).toEqual(['api', 'api'])
	})

	it('makes play, play-stream, and get-properties api panes of audio-output-1', () => {
		const kinds = Object.fromEntries(
			entryPanes(audioOutput).map((pane) => [pane.id, pane.data.kind])
		)
		expect(kinds['audio-output-1::play']).toBe('api')
		expect(kinds['audio-output-1::play-stream']).toBe('api')
		expect(kinds['audio-output-1::get-properties']).toBe('api')
	})

	it('offers motion its composite only', () => {
		expect(compositePane(motion)?.id).toBe('motion-1::composite')
		expect(entryPanes(motion)).toEqual([])
	})

	it.each([
		['navigation-1::controls', navigation],
		['slam-1::controls', slam],
		['audio-input-1::controls', audioInput],
		['discovery-1::controls', discovery],
		['audio-output-1::controls', audioOutput],
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
				'get-paths',
				'get-properties',
			],
		],
		[
			'slam-1',
			slam,
			['controls', 'get-position', 'get-point-cloud-map', 'get-properties', 'get-internal-state'],
		],
		[
			'board-1',
			board,
			[
				'controls',
				'pins',
				'set-gpio',
				'get-gpio',
				'pwm',
				'set-pwm',
				'pwm-frequency',
				'set-pwm-frequency',
				'read-analog-reader',
				'write-analog',
				'get-digital-interrupt-value',
				'stream-ticks',
				'set-power-mode',
			],
		],
	])('offers %s a composite and its entries in registry order', (name, target, ids) => {
		expect(compositePane(target)?.id).toBe(`${name}::composite`)
		expect(entryPanes(target).map(({ id }) => id)).toEqual(ids.map((id) => `${name}::${id}`))
	})

	it.each([
		['arm-1::composite', 223, 2057],
		['arm-1::controls', 241, 967],
		['arm-1::jog', 241, 407],
		['arm-1::joints', 198, 593],
		['arm-1::move-to-joint-positions', 198, 582],
		['arm-1::move-to-position', 215, 617],
		['arm-1::get-joint-positions', 188, 311],
		['arm-1::is-moving', 152, 89],
		['arm-1::manual-mode', 195, 233],
		['arm-1::stop', 152, 101],
		['motion-1::composite', 242, 703],
		['motor-1::composite', 290, 1090],
		['motor-1::go-to', 270, 153],
		['base-1::composite', 245, 1189],
		['base-1::get-properties', 245, 153],
		['base-1::controls', 278, 289],
		['base-1::quick-move', 278, 239],
		['base-1::move-straight', 299, 153],
		['base-1::spin', 288, 153],
		['base-1::set-power', 152, 217],
		['base-1::set-velocity', 152, 217],
		['base-1::is-moving', 152, 89],
		['base-1::stop', 152, 101],
		['gantry-1::composite', 171, 1606],
		['gantry-1::controls', 168, 467],
		['gantry-1::get-position', 178, 297],
		['gantry-1::move-to-position', 152, 553],
		['gantry-1::home', 152, 127],
		['gantry-1::is-moving', 152, 89],
		['gantry-1::get-lengths', 185, 153],
		['gantry-1::quick-move', 97, 409],
		['servo-1::composite', 171, 590],
		['servo-1::controls', 274, 337],
		['servo-1::move-to', 274, 185],
		['servo-1::move', 278, 155],
		['servo-1::get-position', 152, 141],
		['servo-1::is-moving', 152, 89],
		['servo-1::stop', 152, 101],
		['servo-1::quick-move', 198, 221],
		['gripper-1::composite', 246, 680],
		['gripper-1::controls', 232, 191],
		['gripper-1::open-grab', 138, 145],
		['gripper-1::is-holding-something', 196, 132],
		['gripper-1::is-moving', 152, 132],
		['gripper-1::open', 152, 129],
		['gripper-1::grab', 152, 175],
		['gripper-1::stop', 152, 137],
		['gripper-1::get-current-inputs', 152, 207],
		['gripper-1::go-to-inputs', 221, 225],
		['board-1::composite', 178, 1938],
		['board-1::controls', 242, 423],
		['board-1::pins', 255, 264],
		['switch-1::composite', 181, 443],
		['switch-1::controls', 142, 147],
		['switch-1::set-position', 152, 115],
		['switch-1::get-position', 152, 133],
		['switch-1::get-number-of-positions', 152, 183],
		['button-1::composite', 162, 125],
		['sensor-1::composite', 261, 399],
		['movement-sensor-1::composite', 241, 1460],
		['movement-sensor-1::controls', 290, 585],
		['movement-sensor-1::get-position', 208, 193],
		['movement-sensor-1::get-orientation', 152, 161],
		['movement-sensor-1::get-compass-heading', 211, 131],
		['movement-sensor-1::get-accuracy', 185, 227],
		['movement-sensor-1::get-linear-velocity', 152, 181],
		['movement-sensor-1::get-angular-velocity', 152, 181],
		['movement-sensor-1::get-linear-acceleration', 152, 181],
		['movement-sensor-1::get-properties', 261, 243],
		['movement-sensor-1::get-readings', 152, 395],
		['power-sensor-1::composite', 213, 453],
		['power-sensor-1::controls', 305, 269],
		['power-sensor-1::get-voltage', 197, 125],
		['power-sensor-1::get-current', 189, 125],
		['power-sensor-1::get-power', 178, 125],
		['power-sensor-1::get-readings', 152, 395],
		['encoder-1::composite', 213, 434],
		['encoder-1::controls', 164, 207],
		['encoder-1::get-position', 164, 125],
		['encoder-1::reset-position', 152, 157],
		['encoder-1::get-properties', 253, 123],
		['input-controller-1::composite', 213, 585],
		['input-controller-1::get-events', 242, 299],
		['input-controller-1::trigger-event', 234, 239],
		['navigation-1::composite', 118, 1443],
		['navigation-1::controls', 250, 428],
		['navigation-1::get-mode', 152, 111],
		['navigation-1::set-mode', 250, 121],
		['navigation-1::get-location', 152, 215],
		['navigation-1::get-waypoints', 152, 135],
		['navigation-1::add-waypoint', 259, 153],
		['navigation-1::remove-waypoint', 182, 143],
		['navigation-1::get-obstacles', 234, 325],
		['navigation-1::get-paths', 179, 117],
		['navigation-1::get-properties', 152, 93],
		['slam-1::composite', 225, 874],
		['slam-1::controls', 250, 583],
		['slam-1::get-position', 225, 351],
		['slam-1::get-point-cloud-map', 167, 145],
		['slam-1::get-properties', 246, 241],
		['slam-1::get-internal-state', 186, 127],
		['audio-input-1::composite', 110, 404],
		['audio-input-1::controls', 100, 267],
		['audio-input-1::get-audio', 284, 183],
		['audio-input-1::get-properties', 239, 147],
		['discovery-1::composite', 222, 157],
		['discovery-1::controls', 191, 483],
		['discovery-1::discover-resources', 172, 127],
		['ml-model-1::composite', 288, 891],
		['ml-model-1::metadata', 288, 461],
		['ml-model-1::infer', 237, 405],
		['audio-output-1::composite', 116, 811],
		['audio-output-1::controls', 116, 200],
		['audio-output-1::play', 254, 229],
		['audio-output-1::play-stream', 254, 267],
		['audio-output-1::get-properties', 239, 147],
	])('snaps %s to its registry size plus the frame, at least its header', (id, width, height) => {
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
			...entryPanes(inputController),
			...entryPanes(arm),
			...entryPanes(motor),
			...entryPanes(base),
			...entryPanes(gantry),
			...entryPanes(servo),
			...entryPanes(gripper),
			...entryPanes(board),
			...entryPanes(movementSensor),
			...entryPanes(powerSensor),
			...entryPanes(encoder),
			...entryPanes(switchResource),
			compositePane(navigation),
			...entryPanes(navigation),
			compositePane(slam),
			...entryPanes(slam),
			compositePane(audioInput),
			...entryPanes(audioInput),
			compositePane(discovery),
			...entryPanes(discovery),
			compositePane(mlModel),
			...entryPanes(mlModel),
			compositePane(audioOutput),
			...entryPanes(audioOutput),
		].find((candidate) => candidate?.id === id)
		expect(pane && resourcePaneMinimum(pane.data)).toEqual({ width, height })
	})
})
