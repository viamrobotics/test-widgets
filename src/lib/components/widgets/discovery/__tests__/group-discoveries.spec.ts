import { describe, expect, it } from 'vitest'

import { groupDiscoveries } from '../group-discoveries'
import {
	fakeServices,
	hueAxes,
	loneIndexed,
	makeConfig,
	onvifStreams,
	upnpEndpoints,
	webcamModes,
} from './__fixtures__/discoveries-config'

describe('groupDiscoveries', () => {
	it('groups webcam IntegratedCamera-0 to -5 into one resource', () => {
		const result = groupDiscoveries(webcamModes)

		expect(result).toHaveLength(1)
		expect(result[0]?.name).toBe('IntegratedCamera')
		expect(result[0]?.variants).toEqual(webcamModes)
	})

	it('groups ONVIF -url0 and -url1 under the stem', () => {
		const result = groupDiscoveries(onvifStreams)

		expect(result.map((resource) => resource.name)).toEqual(['amcrest'])
		expect(result[0]?.variants).toHaveLength(2)
	})

	it('keeps Hue color-x and color-y apart', () => {
		expect(groupDiscoveries(hueAxes).map((resource) => resource.name)).toEqual([
			'color-x',
			'color-y',
		])
	})

	it('keeps a UPnP mid-name index apart', () => {
		expect(groupDiscoveries(upnpEndpoints)).toHaveLength(2)
	})

	it('keeps fake1 and fake2 with different APIs apart', () => {
		expect(groupDiscoveries(fakeServices).map((resource) => resource.name)).toEqual([
			'fake1',
			'fake2',
		])
	})

	it('keeps a lone -0 single, named as is', () => {
		const [resource] = groupDiscoveries([loneIndexed])

		expect(resource?.name).toBe('solo-0')
		expect(resource?.variants).toEqual([loneIndexed])
	})

	it('does not group the same names across models', () => {
		const result = groupDiscoveries([
			makeConfig('cam-0', 'rdk:component:camera', 'a:b:c'),
			makeConfig('cam-1', 'rdk:component:camera', 'a:b:d'),
		])

		expect(result).toHaveLength(2)
	})

	it('does not group indexes that do not count from 0', () => {
		const result = groupDiscoveries([
			makeConfig('cam-1', 'rdk:component:camera', 'a:b:c'),
			makeConfig('cam-2', 'rdk:component:camera', 'a:b:c'),
		])

		expect(result).toHaveLength(2)
	})

	it('sorts by name and keeps variants in input order', () => {
		const reversed = webcamModes.toReversed()
		const result = groupDiscoveries([...reversed, ...hueAxes.toReversed()])

		expect(result.map((resource) => resource.name)).toEqual([
			'color-x',
			'color-y',
			'IntegratedCamera',
		])
		expect(result[2]?.variants).toEqual(reversed)
	})
})
