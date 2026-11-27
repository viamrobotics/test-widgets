export const TENSOR_DATA_TYPES = [
	'int8',
	'uint8',
	'int16',
	'uint16',
	'int32',
	'uint32',
	'int64',
	'uint64',
	'float32',
	'float64',
] as const

export type TensorDataType = (typeof TENSOR_DATA_TYPES)[number]

export const DEFAULT_TENSOR_DATA_TYPE: TensorDataType = 'float32'

// A `ReadonlySet<string>` takes any string, where the tuple's `includes` and the lint fixer's rewrite of `some` both reject one.
const TENSOR_DATA_TYPE_NAMES: ReadonlySet<string> = new Set(TENSOR_DATA_TYPES)

export const isTensorDataType = (value: string): value is TensorDataType =>
	TENSOR_DATA_TYPE_NAMES.has(value)

export const isIntegerDataType = (dataType: TensorDataType): boolean =>
	dataType !== 'float32' && dataType !== 'float64'
