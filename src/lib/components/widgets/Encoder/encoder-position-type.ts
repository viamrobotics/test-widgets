import { EncoderPositionType, type EncoderProperties } from '@viamrobotics/sdk'

/**
 * Picks the position type to request from an encoder based on its properties.
 * @param properties - The encoder's reported properties, if loaded.
 * @returns A single-element argument tuple for `getPosition`.
 * @example getEncoderPositionArgs({ angleDegreesSupported: true }) // [EncoderPositionType.ANGLE_DEGREES]
 */
export const getEncoderPositionArgs = (
	properties: EncoderProperties | undefined
): [EncoderPositionType] => {
	if (!properties) {
		return [EncoderPositionType.UNSPECIFIED]
	}

	const { angleDegreesSupported, ticksCountSupported } = properties

	if (angleDegreesSupported) {
		return [EncoderPositionType.ANGLE_DEGREES]
	}

	if (ticksCountSupported) {
		return [EncoderPositionType.TICKS_COUNT]
	}

	return [EncoderPositionType.UNSPECIFIED]
}
