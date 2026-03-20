export const formatNumeric = (value?: number, decimals = 2) => {
	if (value === undefined) {
		return '––';
	}

	if (Number.isNaN(value)) {
		return 'NaN';
	}

	if (value === Number.POSITIVE_INFINITY) {
		return '+∞';
	}

	if (value === Number.NEGATIVE_INFINITY) {
		return '-∞';
	}

	return value.toFixed(decimals);
};

/**
 * Convert degrees to radians
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
export const degreesToRadians = (degrees: number): number => {
	return degrees * (Math.PI / 180);
};

/**
 * Convert radians to degrees
 * @param radians Angle in radians
 * @returns Angle in degrees
 */
export const radiansToDegrees = (radians: number): number => {
	return radians * (180 / Math.PI);
};
