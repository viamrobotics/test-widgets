import type { JsonValue } from '@viamrobotics/sdk'

const MISSING_VALUE_LABEL = '-'

/** The text a control or readout shows for one attribute value. A string reads bare, anything else as JSON, and a missing value as `-`. */
export const fieldValueLabel = (value: JsonValue | undefined): string => {
	if (value === undefined) return MISSING_VALUE_LABEL
	if (typeof value === 'string') return value
	return JSON.stringify(value)
}
