import { describe, expect, it } from 'vitest'

import { getBoundingRect, shouldDisplayBoxFill } from '../annotation-edit-utils'
import { type BoundingBox, ResizeHandleLocation } from '../bounding-box-types'

const box: BoundingBox = {
	id: 'test',
	label: 'test-label',
	xMinNormalized: 0.1,
	xMaxNormalized: 0.2,
	yMinNormalized: 0.3,
	yMaxNormalized: 0.45,
}

const width = 100
const height = 200

describe('getBoundingRect', () => {
	it('should return a box scaled to the container dimensions when not translating or resizing', () => {
		const result = getBoundingRect(box, undefined, width, height, undefined)

		expect(result.xMinNormalized).toEqual(10)
		expect(result.xMaxNormalized).toEqual(20)
		expect(result.yMinNormalized).toEqual(60)
		expect(result.yMaxNormalized).toEqual(90)
	})

	it('should return scaled and translated dimensions when a drag distance is provided', () => {
		const result = getBoundingRect(box, { x: 30, y: -20 }, width, height, undefined)

		expect(result.xMinNormalized).toEqual(40)
		expect(result.xMaxNormalized).toEqual(50)
		expect(result.yMinNormalized).toEqual(40)
		expect(result.yMaxNormalized).toEqual(70)
	})

	it('should return max container size when annotation is translated outside the bounds of container', () => {
		const result = getBoundingRect(box, { x: -15, y: 120 }, width, height, undefined)

		expect(result.xMinNormalized).toEqual(0)
		expect(result.xMaxNormalized).toEqual(10)
		expect(result.yMinNormalized).toEqual(170)
		expect(result.yMaxNormalized).toEqual(200)
	})

	it('should return scaled and resized dimensions when a drag distance is provided and a corner was interacted with', () => {
		const result = getBoundingRect(box, { x: -5, y: 5 }, width, height, ResizeHandleLocation.TL)

		expect(result.xMinNormalized).toEqual(5)
		expect(result.xMaxNormalized).toEqual(20)
		expect(result.yMinNormalized).toEqual(65)
		expect(result.yMaxNormalized).toEqual(90)
	})

	it('should resize differently depending on corner', () => {
		const result = getBoundingRect(box, { x: -5, y: 5 }, width, height, ResizeHandleLocation.BR)

		expect(result.xMinNormalized).toEqual(10)
		expect(result.xMaxNormalized).toEqual(15)
		expect(result.yMinNormalized).toEqual(60)
		expect(result.yMaxNormalized).toEqual(95)
	})

	it('should invert min and max values when resize makes the min larger than the max', () => {
		const result = getBoundingRect(box, { x: 20, y: 40 }, width, height, ResizeHandleLocation.TL)

		expect(result.xMinNormalized).toEqual(20)
		expect(result.xMaxNormalized).toEqual(30)
		expect(result.yMinNormalized).toEqual(90)
		expect(result.yMaxNormalized).toEqual(100)
	})

	it('should not resize beyond the bounds of the container', () => {
		const result = getBoundingRect(box, { x: -15, y: 200 }, width, height, ResizeHandleLocation.TL)

		expect(result.xMinNormalized).toEqual(0)
		expect(result.xMaxNormalized).toEqual(20)
		expect(result.yMinNormalized).toEqual(90)
		expect(result.yMaxNormalized).toEqual(200)
	})
})

describe('shouldDisplayBoxFill', () => {
	it('should return true if there is an edit target and the annotation is being edited', () => {
		const result = shouldDisplayBoxFill('someID', false, undefined, 'someID', {})

		expect(result).toEqual(true)
	})
	it('should return false if there is an edit target but annotation is not being edited', () => {
		const result = shouldDisplayBoxFill('someID', false, undefined, 'someOtherID', {})

		expect(result).toEqual(false)
	})
	it('should return true if there is no edit target but current annotation is focused', () => {
		const result = shouldDisplayBoxFill('someID', false, 'someID', undefined, {})

		expect(result).toEqual(true)
	})

	it('should return true if there is no edit target but current annotation is hovered', () => {
		const result = shouldDisplayBoxFill('someID', false, undefined, undefined, {
			someID: true,
		})

		expect(result).toEqual(true)
	})

	it('should return true if there is no edit target and current annotation is hovered but another box is currently being edited', () => {
		const result = shouldDisplayBoxFill('someID', true, undefined, undefined, {
			someID: true,
		})

		expect(result).toEqual(false)
	})

	it('should return false if there is no edit target but current annotation is not focused or hovered', () => {
		const result = shouldDisplayBoxFill('someID', false, 'someOtherID', undefined, {
			someID: false,
			someOtherID: true,
		})

		expect(result).toEqual(false)
	})
})
