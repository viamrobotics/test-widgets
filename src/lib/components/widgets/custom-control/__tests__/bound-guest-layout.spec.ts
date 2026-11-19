import { describe, expect, it } from 'vitest'

import { boundGuestLayout } from '../bound-guest-layout'

describe('boundGuestLayout', () => {
	it.each([
		{
			name: 'caps a minWidth wider than 320',
			stated: { minWidth: 400 },
			bounded: { minWidth: 320 },
		},
		{
			name: 'keeps a minWidth of 320 or less',
			stated: { minWidth: 240 },
			bounded: { minWidth: 240 },
		},
		{
			name: 'raises idealWidth to the capped minWidth',
			stated: { minWidth: 400, idealWidth: 280 },
			bounded: { minWidth: 320, idealWidth: 320 },
		},
		{
			name: 'keeps an idealWidth wider than the minWidth',
			stated: { minWidth: 240, idealWidth: 480 },
			bounded: { minWidth: 240, idealWidth: 480 },
		},
		{
			name: 'raises idealHeight to minHeight',
			stated: { minHeight: 200, idealHeight: 120 },
			bounded: { minHeight: 200, idealHeight: 200 },
		},
		{
			name: 'leaves a tall minHeight uncapped',
			stated: { minHeight: 2000 },
			bounded: { minHeight: 2000 },
		},
		{
			name: 'keeps ideals alone when no minimum is stated',
			stated: { idealWidth: 500, idealHeight: 90 },
			bounded: { idealWidth: 500, idealHeight: 90 },
		},
		{
			name: 'returns an empty layout for an empty one',
			stated: {},
			bounded: {},
		},
	])('$name', ({ stated, bounded }) => {
		expect(boundGuestLayout(stated)).toStrictEqual(bounded)
	})
})
