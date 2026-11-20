import type { TensorDataType } from './tensor-data-type'

export interface TensorValueRange {
	min: number
	max: number
}

const INT8_MIN = -128
const INT8_MAX = 127
const UINT8_MAX = 255
const INT16_MIN = -32_768
const INT16_MAX = 32_767
const UINT16_MAX = 65_535
const INT32_MIN = -2_147_483_648
const INT32_MAX = 2_147_483_647
const UINT32_MAX = 4_294_967_295
const UNSIGNED_MIN = 0

// JSON numbers are doubles, so a 64-bit integer past the safe range has already lost precision.
const INT64_MIN = Number.MIN_SAFE_INTEGER
const INT64_MAX = Number.MAX_SAFE_INTEGER

const INTEGER_RANGES: ReadonlyMap<TensorDataType, TensorValueRange> = new Map([
	['int8', { min: INT8_MIN, max: INT8_MAX }],
	['uint8', { min: UNSIGNED_MIN, max: UINT8_MAX }],
	['int16', { min: INT16_MIN, max: INT16_MAX }],
	['uint16', { min: UNSIGNED_MIN, max: UINT16_MAX }],
	['int32', { min: INT32_MIN, max: INT32_MAX }],
	['uint32', { min: UNSIGNED_MIN, max: UINT32_MAX }],
	['int64', { min: INT64_MIN, max: INT64_MAX }],
	['uint64', { min: UNSIGNED_MIN, max: INT64_MAX }],
])

/** The values an integer type holds, or undefined for a float type, which takes any finite number. */
export const tensorValueRange = (dataType: TensorDataType): TensorValueRange | undefined =>
	INTEGER_RANGES.get(dataType)

export const isInTensorRange = (value: number, dataType: TensorDataType): boolean => {
	const range = tensorValueRange(dataType)
	return range === undefined || (value >= range.min && value <= range.max)
}
