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
	])("snaps %s to its board's minimum", (id, width, height) => {
		const pane = [
			compositePane(arm),
			compositePane(motion),
			compositePane(motor),
			...entryPanes(arm),
			...entryPanes(motor),
		].find((candidate) => candidate?.id === id)
		expect(pane && resourcePaneMinimum(pane.data)).toEqual({ width, height })
	})
})
