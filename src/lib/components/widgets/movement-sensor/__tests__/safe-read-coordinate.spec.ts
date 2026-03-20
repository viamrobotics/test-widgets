import { describe, expect, it } from 'vitest';

import { safeReadCoordinate } from '../safe-read-coordinate.ts';

describe('safeReadCoordinate', () => {
	it('returns a number when passed a number', () => {
		const result = safeReadCoordinate(123);

		expect(result).toEqual(123);
	});

	it('returns undefined when passed undefined', () => {
		const result = safeReadCoordinate(undefined);

		expect(result).toEqual(undefined);
	});

	it('returns undefined when passed NaN', () => {
		const result = safeReadCoordinate(Number.NaN);

		expect(result).toEqual(undefined);
	});
});
