import type { ResourceName } from '@viamrobotics/sdk'

import { describe, expect, it } from 'vitest'

import { compositePane, entryPanes, resourcePaneMethod } from '../resource-pane'
import { resourcePaneMinimum } from '../resource-pane-minimums'

const resource = (subtype: string, name: string): ResourceName => ({
	namespace: 'rdk',
	type: subtype === 'motion' ? 'service' : 'component',
	subtype,
	name,
})

const arm = resource('arm', 'arm-1')
const motor = resource('motor', 'motor-1')
const motion = resource('motion', 'motion-1')
const base = resource('base', 'base-1')
const gantry = resource('gantry', 'gantry-1')
const servo = resource('servo', 'servo-1')

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
	])("snaps %s to its board's minimum", (id, width, height) => {
		const pane = [
			compositePane(arm),
			compositePane(motion),
			compositePane(motor),
			compositePane(base),
			compositePane(gantry),
			compositePane(servo),
			...entryPanes(arm),
			...entryPanes(motor),
			...entryPanes(base),
			...entryPanes(gantry),
			...entryPanes(servo),
		].find((candidate) => candidate?.id === id)
		expect(pane && resourcePaneMinimum(pane.data)).toEqual({ width, height })
	})
})
