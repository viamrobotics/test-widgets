import { isIntegerDataType, type TensorDataType } from './tensor-data-type'
import { isInTensorRange } from './tensor-value-range'

const SHAPE_SEPARATOR = ','
const WHOLE_NUMBER = /^\d+$/u

/** Reads "1, 224, 224, 3" into extents, or undefined when any part is not a whole number. */
export const parseTensorShape = (shapeText: string): bigint[] | undefined => {
	const parts = shapeText.split(SHAPE_SEPARATOR).map((part) => part.trim())
	if (!parts.every((part) => WHOLE_NUMBER.test(part))) return undefined
	return parts.map(BigInt)
}

const isNumberList = (value: unknown): value is number[] =>
	Array.isArray(value) &&
	value.length > 0 &&
	value.every((item) => typeof item === 'number' && Number.isFinite(item))

/** Reads a JSON array of finite numbers, or undefined when the text is not one. */
export const parseNumberList = (dataText: string): number[] | undefined => {
	let parsed: unknown
	try {
		parsed = JSON.parse(dataText)
	} catch {
		return undefined
	}
	return isNumberList(parsed) ? parsed : undefined
}

export const isWholeNumberList = (values: number[]): boolean =>
	values.every((item) => Number.isInteger(item))

export const isListInRange = (values: number[], dataType: TensorDataType): boolean =>
	values.every((item) => isInTensorRange(item, dataType))

/**
 * Reads a JSON array of numbers, or undefined when it is not one, or holds a fraction or a value
 * outside the range of an integer type.
 */
export const parseTensorData = (
	dataText: string,
	dataType: TensorDataType
): number[] | undefined => {
	const values = parseNumberList(dataText)
	if (values === undefined) return undefined
	if (isIntegerDataType(dataType) && !isWholeNumberList(values)) return undefined
	return isListInRange(values, dataType) ? values : undefined
}
