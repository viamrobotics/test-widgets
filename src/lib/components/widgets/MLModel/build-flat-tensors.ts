import type { FlatTensors } from '@viamrobotics/sdk'

import type { TensorDataType } from './tensor-data-type'

import { isListInRange } from './parse-tensor-input'

export interface TensorInput {
	name: string
	dataType: TensorDataType
	shape: bigint[]
	values: number[]
}

interface FlatTensorValue {
	case: string
	value: { data: Uint8Array | number[] | bigint[] }
}

const toBigInts = (values: number[]): bigint[] => values.map(BigInt)

const tensorValue = (dataType: TensorDataType, values: number[]): FlatTensorValue => {
	switch (dataType) {
		case 'int8': {
			return {
				case: 'int8Tensor',
				value: { data: new Uint8Array(Int8Array.from(values).buffer) },
			}
		}
		case 'uint8': {
			return { case: 'uint8Tensor', value: { data: Uint8Array.from(values) } }
		}
		case 'int16': {
			return { case: 'int16Tensor', value: { data: values } }
		}
		case 'uint16': {
			return { case: 'uint16Tensor', value: { data: values } }
		}
		case 'int32': {
			return { case: 'int32Tensor', value: { data: values } }
		}
		case 'uint32': {
			return { case: 'uint32Tensor', value: { data: values } }
		}
		case 'int64': {
			return { case: 'int64Tensor', value: { data: toBigInts(values) } }
		}
		case 'uint64': {
			return { case: 'uint64Tensor', value: { data: toBigInts(values) } }
		}
		case 'float32': {
			return { case: 'floatTensor', value: { data: values } }
		}
		case 'float64': {
			return { case: 'doubleTensor', value: { data: values } }
		}
	}
}

// The SDK exports `FlatTensors` as a type only, and its request constructor turns this plain
// shape into the message, so the check is structural.
const isFlatTensors = (value: unknown): value is FlatTensors =>
	typeof value === 'object' && value !== null && 'tensors' in value

/** Builds the name-indexed tensors that `infer` takes, one typed array per tensor. */
export const buildFlatTensors = (inputs: TensorInput[]): FlatTensors => {
	if (!inputs.every((input) => isListInRange(input.values, input.dataType))) {
		throw new Error('Input values do not fit their tensor type')
	}
	const flatTensors = {
		tensors: Object.fromEntries(
			inputs.map((input) => [
				input.name,
				{ shape: input.shape, tensor: tensorValue(input.dataType, input.values) },
			])
		),
	}
	if (!isFlatTensors(flatTensors)) throw new Error('Input tensors are not a name-indexed map')
	return flatTensors
}
