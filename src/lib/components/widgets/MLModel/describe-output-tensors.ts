import type { FlatTensors } from '@viamrobotics/sdk'

type FlatTensor = FlatTensors['tensors'][string]

interface OutputTensorRow {
	name: string
	dataType: string
	shape: string
	preview: string
	summary: { dataType: string; shape: number[]; data: (number | string)[] }
}

const PREVIEW_COUNT = 8
const MISSING_VALUE = '-'

const dataTypeByCase: Record<string, string> = {
	int8Tensor: 'int8',
	uint8Tensor: 'uint8',
	int16Tensor: 'int16',
	uint16Tensor: 'uint16',
	int32Tensor: 'int32',
	uint32Tensor: 'uint32',
	int64Tensor: 'int64',
	uint64Tensor: 'uint64',
	floatTensor: 'float32',
	doubleTensor: 'float64',
}

const valuesOf = (tensor: FlatTensor): (number | bigint)[] => {
	const { case: tensorCase, value } = tensor.tensor
	if (tensorCase === undefined) return []
	// int8 data arrives as raw bytes, so each byte is read back as a signed value.
	if (tensorCase === 'int8Tensor') {
		return [...new Int8Array(value.data.buffer, value.data.byteOffset, value.data.byteLength)]
	}
	return [...value.data]
}

const jsonSafe = (value: number | bigint): number | string =>
	typeof value === 'bigint' || !Number.isFinite(value) ? String(value) : value

const previewOf = (values: (number | bigint)[]): string => {
	if (values.length === 0) return MISSING_VALUE
	const shown = values.slice(0, PREVIEW_COUNT).map(String).join(', ')
	return values.length > PREVIEW_COUNT ? `${shown}, …` : shown
}

const describeTensor = (name: string, tensor: FlatTensor): OutputTensorRow => {
	const values = valuesOf(tensor)
	const dataType = dataTypeByCase[tensor.tensor.case ?? ''] ?? MISSING_VALUE
	const shape = tensor.shape.map((extent) => extent.toString())
	return {
		name,
		dataType,
		shape: shape.length === 0 ? MISSING_VALUE : shape.join(', '),
		preview: previewOf(values),
		summary: {
			dataType,
			shape: shape.map(Number),
			data: values.map((value) => jsonSafe(value)),
		},
	}
}

export const describeOutputTensors = (tensors: FlatTensors | undefined): OutputTensorRow[] =>
	Object.entries(tensors?.tensors ?? {}).map(([name, tensor]) => describeTensor(name, tensor))
