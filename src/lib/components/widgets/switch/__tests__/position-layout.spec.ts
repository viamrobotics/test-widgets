import { describe, expect, it } from 'vitest'

import { choosePositionLayout } from '../position-layout'

const WIDTHS = { beside: 200, under: 140 }

describe('choosePositionLayout', () => {
	it.each([
		{ room: 300, current: 'select', expected: 'beside' },
		{ room: 170, current: 'select', expected: 'under' },
		{ room: 100, current: 'beside', expected: 'select' },
	] as const)('picks $expected at $room px from $current', ({ room, current, expected }) => {
		expect(choosePositionLayout(WIDTHS, room, current)).toBe(expected)
	})

	it('keeps the group beside its label at an exact fit', () => {
		expect(choosePositionLayout(WIDTHS, 200, 'beside')).toBe('beside')
	})

	it('does not move the group beside its label at an exact fit', () => {
		expect(choosePositionLayout(WIDTHS, 200, 'under')).toBe('under')
	})

	it('moves the group beside its label once 4 px spare', () => {
		expect(choosePositionLayout(WIDTHS, 204, 'under')).toBe('beside')
	})

	it('keeps the group under its label at an exact fit', () => {
		expect(choosePositionLayout(WIDTHS, 140, 'under')).toBe('under')
	})

	it('keeps the Select while the group fits the row by less than 4 px', () => {
		expect(choosePositionLayout(WIDTHS, 143, 'select')).toBe('select')
	})
})
