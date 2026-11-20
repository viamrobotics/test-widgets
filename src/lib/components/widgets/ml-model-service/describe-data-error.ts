import {
	isListInRange,
	isWholeNumberList,
	parseNumberList,
	parseTensorShape,
} from './parse-tensor-input'
import { isIntegerDataType, type TensorDataType } from './tensor-data-type'
import { tensorValueRange } from './tensor-value-range'

export const DATA_HINT = 'Enter Data as a JSON list of numbers, whole numbers for an integer type.'

const countOf = (shape: bigint[]): bigint => shape.reduce((product, extent) => product * extent, 1n)

/** Says why a Data field cannot be sent for its type and Shape, or returns undefined when it can. */
export const describeDataError = (
	dataText: string,
	dataType: TensorDataType,
	shapeText: string
): string | undefined => {
	const values = parseNumberList(dataText)
	if (values === undefined) return DATA_HINT
	if (isIntegerDataType(dataType) && !isWholeNumberList(values)) return DATA_HINT
	const range = tensorValueRange(dataType)
	if (range !== undefined && !isListInRange(values, dataType)) {
		return `Every ${dataType} value must be a whole number from ${range.min} to ${range.max}.`
	}
	const shape = parseTensorShape(shapeText)
	if (shape !== undefined && countOf(shape) !== BigInt(values.length)) {
		return `Data has ${values.length} values, but the Shape holds ${countOf(shape)}.`
	}
	return undefined
}
