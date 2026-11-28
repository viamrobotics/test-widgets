import type { ResourceName } from '@viamrobotics/sdk'

import { describe, expect, it, vi } from 'vitest'

import {
	type ResourcePane,
	resourcePaneLabel,
	resourcePaneMethod,
	resourcePanes,
} from '../resource-pane'
import { resourcePaneBodyMaxWidth, resourcePaneMinimum } from '../resource-pane-minimums'

vi.mock('#lib/resource-widgets.js', async () => {
	const { stubWidgetsForResource } = await import('./__fixtures__/stub-widgets-for-resource')
	return { widgetsForResource: stubWidgetsForResource }
})

const resource = (subtype: string, name: string): ResourceName => ({
	namespace: 'rdk',
	type: 'component',
	subtype,
	name,
})

const arm = resource('arm', 'arm-1')
const motor = resource('motor', 'motor-1')
const button = resource('button', 'button-1')

describe('resourcePanes', () => {
	it("makes one pane per widget in the entry's order, with the resource and key in its id", () => {
		expect(resourcePanes(motor).map(({ id }) => id)).toEqual([
			'rdk:component:motor/motor-1::quickMove',
			'rdk:component:motor/motor-1::setPower',
			'rdk:component:motor/motor-1::setRpm',
			'rdk:component:motor/motor-1::goFor',
			'rdk:component:motor/motor-1::goTo',
			'rdk:component:motor/motor-1::isMoving',
		])
	})

	it("takes each pane's kind from its definition", () => {
		const kinds = Object.fromEntries(resourcePanes(arm).map(({ data }) => [data.key, data.kind]))
		expect(kinds).toEqual({ jog: 'control', moveToPosition: 'api', getEndPosition: 'api' })
	})

	it('titles a pane from its key, with the host label for a listed key', () => {
		const titles = resourcePanes(motor).map(({ data }) => data.title)
		expect(titles).toEqual(['QuickMove', 'SetPower', 'SetRPM', 'GoFor', 'GoTo', 'IsMoving'])
	})

	it('makes no panes for a resource without an entry', () => {
		expect(resourcePanes(button)).toEqual([])
	})
})

describe('resourcePaneMethod and resourcePaneLabel', () => {
	it('gives an api pane its title as the method and a control none', () => {
		const [jog, moveToPosition] = resourcePanes(arm)
		expect(jog && resourcePaneMethod(jog.data)).toBeUndefined()
		expect(moveToPosition && resourcePaneMethod(moveToPosition.data)).toBe('MoveToPosition')
	})

	it('labels a pane with its resource and title', () => {
		const setRpm = resourcePanes(motor).find(({ data }) => data.key === 'setRpm')
		expect(setRpm && resourcePaneLabel(setRpm.data)).toBe('motor-1 SetRPM')
	})
})

describe('resourcePaneMinimum', () => {
	it('adds the frame to the width class floor and the height band', () => {
		const [jog] = resourcePanes(arm)
		expect(jog && resourcePaneMinimum(jog.data)).toEqual({ width: 322, height: 155 })
	})

	it('leaves a fill widget unbounded in width', () => {
		const [jog] = resourcePanes(arm)
		expect(jog && resourcePaneBodyMaxWidth(jog.data)).toBeUndefined()
	})

	it('floors an xl widget at the lg band and bounds its width at the max class', () => {
		const [jog] = resourcePanes(arm)
		if (!jog) throw new Error('No jog pane')
		const tall: ResourcePane = {
			...jog.data,
			definition: {
				...jog.data.definition,
				size: { width: { min: '2xl', max: '4xl' }, height: 'xl' },
			},
		}
		expect(resourcePaneMinimum(tall)).toEqual({ width: 674, height: 515 })
		expect(resourcePaneBodyMaxWidth(tall)).toBe(896)
	})
})
