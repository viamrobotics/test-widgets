import '../../../../../app.css'

import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { tick } from 'svelte'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../infer-widget.svelte'
import PaneSubject from './__fixtures__/in-320-pane.svelte'
import { metadataState } from './__fixtures__/metadata-state.svelte'

interface InputInfoFixture {
	name: string
	description: string
	dataType: string
	shape: number[]
	associatedFiles: never[]
}

const PANE_WIDTH = '320px'

const state = vi.hoisted(
	(): {
		mutate: Mock
		error: Error | null
		data: unknown
		methods: string[]
	} => ({
		mutate: vi.fn(),
		error: null,
		data: undefined,
		methods: [],
	})
)

vi.mock('@viamrobotics/sdk', () => ({
	MLModelClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', async () => {
	const { metadataState } = await import('./__fixtures__/metadata-state.svelte')
	return {
		createResourceClient: vi.fn(() => ({ current: {} })),
		createResourceQuery: vi.fn(() => ({
			get data() {
				return metadataState.value
			},
			isLoading: false,
			isError: false,
			error: null,
		})),
		createResourceMutation: vi.fn((_client: unknown, method: string) => {
			state.methods.push(method)
			return {
				mutate: state.mutate,
				isPending: false,
				get data() {
					return state.data
				},
				get error() {
					return state.error
				},
			}
		}),
	}
})

const INCOMPLETE_HINT = 'Enter a name, shape, and data for each tensor to execute.'
const INVALID_DATA_HINT = 'Enter Data as a JSON list of numbers, whole numbers for an integer type.'

const inputInfo = (name: string, dataType: string, shape: number[]): InputInfoFixture => ({
	name,
	description: '',
	dataType,
	shape,
	associatedFiles: [],
})

const metadataOf = (
	...inputs: InputInfoFixture[]
): { metadata: { inputInfo: InputInfoFixture[] } } => ({
	metadata: { inputInfo: inputs },
})

const modelMetadata = () => metadataOf(inputInfo('image', 'uint8', [1, 2, 2, 3]))

const RANGE_MESSAGES = {
	int8: 'Every int8 value must be a whole number from -128 to 127.',
	uint8: 'Every uint8 value must be a whole number from 0 to 255.',
	int64: `Every int64 value must be a whole number from ${Number.MIN_SAFE_INTEGER} to ${Number.MAX_SAFE_INTEGER}.`,
}
const MISMATCH_MESSAGE = 'Data has 3 values, but the Shape holds 4.'
const UNSAFE_INT64_TEXT = '[9007199254740993, 1, 2, 3]'

const expectDataRejected = (message: string) => {
	expect(getExecute()).toBeDisabled()
	expect(getExecute()).toHaveAccessibleDescription(message)
	expect(screen.getByText(message)).toBeVisible()
	expect(screen.getByRole('textbox', { name: 'Data' })).toBeInvalid()
	expect(screen.getByRole('textbox', { name: 'Data' })).toHaveAccessibleDescription(message)
	expect(state.mutate).not.toHaveBeenCalled()
}

const renderSubject = () =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-ml-model' } })

const getExecute = () => screen.getByRole('button', { name: /execute/iu })

const typeInto = async (name: string, text: string) => {
	const field = screen.getByRole('textbox', { name })
	await userEvent.click(field)
	await userEvent.paste(text)
}

const sentTensors = () => {
	const [[tensors]] = state.mutate.mock.calls[0]
	return tensors
}

describe('MLModelService Infer widget', () => {
	beforeEach(() => {
		state.mutate = vi.fn()
		state.error = null
		state.data = undefined
		state.methods = []
		metadataState.value = undefined
	})

	it('renders the Infer section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Infer' })).toBeInTheDocument()
		expect(state.methods.some((method) => String(method) === 'infer')).toBe(true)
	})

	it('prefills the input tensor from Metadata and holds Execute until Data is entered', () => {
		metadataState.value = modelMetadata()

		renderSubject()

		expect(screen.getByText('image')).toBeInTheDocument()
		expect(screen.getByRole('textbox', { name: 'Shape' })).toHaveValue('1, 2, 2, 3')
		expect(screen.getByRole('combobox', { name: 'Data type' })).toHaveTextContent('uint8')
		expect(getExecute()).toBeDisabled()
		expect(getExecute()).toHaveAccessibleDescription(INCOMPLETE_HINT)
		expect(screen.getByRole('textbox', { name: 'Data' })).toBeValid()
		expect(screen.queryByText(INVALID_DATA_HINT)).not.toBeInTheDocument()
	})

	it('draws a fresh widget neutral with a hint on Execute', () => {
		renderSubject()

		for (const name of ['Name', 'Shape', 'Data']) {
			expect(screen.getByRole('textbox', { name })).toBeValid()
		}
		expect(screen.getByText(INCOMPLETE_HINT)).toBeVisible()
		expect(getExecute()).toBeDisabled()
		expect(getExecute()).toHaveAccessibleDescription(INCOMPLETE_HINT)
	})

	it('draws an added tensor neutral', async () => {
		renderSubject()
		await userEvent.click(screen.getByRole('button', { name: 'Add tensor' }))

		for (const field of screen.getAllByRole('textbox')) {
			expect(field).toBeValid()
		}
		expect(getExecute()).toHaveAccessibleDescription(INCOMPLETE_HINT)
	})

	it('shows an error for a bad entry and returns to neutral when it is cleared', async () => {
		metadataState.value = modelMetadata()

		renderSubject()
		await typeInto('Data', '[1, "a"]')
		expect(screen.getByRole('textbox', { name: 'Data' })).toBeInvalid()
		await userEvent.clear(screen.getByRole('textbox', { name: 'Data' }))

		expect(screen.getByRole('textbox', { name: 'Data' })).toBeValid()
		expect(screen.queryByText(INVALID_DATA_HINT)).not.toBeInTheDocument()
		expect(getExecute()).toHaveAccessibleDescription(INCOMPLETE_HINT)
	})

	it('sends the entered tensor to infer as a typed array', async () => {
		metadataState.value = modelMetadata()

		renderSubject()
		await typeInto('Data', '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]')
		await userEvent.click(getExecute())

		expect(state.mutate).toHaveBeenCalledTimes(1)
		const tensors = sentTensors()
		const image = tensors.tensors.image
		expect(image.shape).toEqual([1n, 2n, 2n, 3n])
		expect(image.tensor.case).toBe('uint8Tensor')
		expect(image.tensor.value.data).toBeInstanceOf(Uint8Array)
		expect([...image.tensor.value.data]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
	})

	it('disables Execute with its message for Data that is not a list of numbers', async () => {
		metadataState.value = modelMetadata()

		renderSubject()
		await typeInto('Data', '[1, "a"]')

		expect(getExecute()).toBeDisabled()
		expect(getExecute()).toHaveAccessibleDescription(INVALID_DATA_HINT)
		expect(screen.getByText(INVALID_DATA_HINT)).toBeVisible()
		expect(screen.getByRole('textbox', { name: 'Data' })).toBeInvalid()
		expect(state.mutate).not.toHaveBeenCalled()
	})

	it('adds a tensor with a Name field', async () => {
		renderSubject()

		await userEvent.click(screen.getByRole('button', { name: 'Add tensor' }))

		expect(screen.getAllByRole('textbox', { name: 'Name' })).toHaveLength(2)
		expect(screen.getByText('Input 2')).toBeInTheDocument()
	})

	it('rejects an int8 value outside its range', async () => {
		metadataState.value = metadataOf(inputInfo('image', 'int8', [4]))

		renderSubject()
		await typeInto('Data', '[1, 2, 3, 300]')

		expectDataRejected(RANGE_MESSAGES.int8)
	})

	it('rejects a uint8 value outside its range', async () => {
		metadataState.value = metadataOf(inputInfo('image', 'uint8', [4]))

		renderSubject()
		await typeInto('Data', '[1, 2, 3, 256]')

		expectDataRejected(RANGE_MESSAGES.uint8)
	})

	it('rejects a negative value for an unsigned type', async () => {
		metadataState.value = metadataOf(inputInfo('image', 'uint8', [4]))

		renderSubject()
		await typeInto('Data', '[1, 2, 3, -1]')

		expectDataRejected(RANGE_MESSAGES.uint8)
	})

	it('rejects an int64 value past the safe integer range', async () => {
		metadataState.value = metadataOf(inputInfo('image', 'int64', [4]))

		renderSubject()
		await typeInto('Data', UNSAFE_INT64_TEXT)

		expectDataRejected(RANGE_MESSAGES.int64)
	})

	it('rejects a value count that does not fill the Shape', async () => {
		metadataState.value = metadataOf(inputInfo('image', 'float32', [2, 2]))

		renderSubject()
		await typeInto('Data', '[1, 2, 3]')

		expectDataRejected(MISMATCH_MESSAGE)
	})

	it('removes an added tensor but offers no Remove on a Metadata input', async () => {
		metadataState.value = modelMetadata()

		renderSubject()
		expect(screen.queryByRole('button', { name: /remove/iu })).not.toBeInTheDocument()
		await userEvent.click(screen.getByRole('button', { name: 'Add tensor' }))
		await userEvent.click(screen.getByRole('button', { name: 'Remove Input 2' }))

		expect(screen.queryByText('Input 2')).not.toBeInTheDocument()
		expect(screen.getByText('image')).toBeInTheDocument()
	})

	it('describes each invalid field by its own message', async () => {
		renderSubject()
		await typeInto('Name', 'x')
		await typeInto('Shape', 'a')
		await typeInto('Data', '[1, "a"]')

		const shapeMessage = 'Enter Shape as whole numbers separated by commas.'
		expect(screen.getByRole('textbox', { name: 'Shape' })).toHaveAccessibleDescription(shapeMessage)
		expect(screen.getByRole('textbox', { name: 'Data' })).toHaveAccessibleDescription(
			INVALID_DATA_HINT
		)
		expect(getExecute()).toHaveAccessibleDescription(shapeMessage)
	})

	it('shows the Name field of two Metadata inputs that share a name', () => {
		metadataState.value = metadataOf(inputInfo('a', 'float32', [1]), inputInfo('a', 'float32', [1]))

		renderSubject()

		expect(screen.getAllByRole('textbox', { name: 'Name' })).toHaveLength(2)
		expect(getExecute()).toHaveAccessibleDescription('Give each input tensor a different name.')
	})

	it('seeds from Metadata once and keeps an edit when Metadata refetches', async () => {
		metadataState.value = modelMetadata()

		renderSubject()
		await typeInto('Data', '[1, 2, 3, 4]')
		metadataState.value = metadataOf(inputInfo('other', 'float32', [7]))
		await tick()

		expect(screen.getByText('image')).toBeInTheDocument()
		expect(screen.getByRole('textbox', { name: 'Shape' })).toHaveValue('1, 2, 2, 3')
		expect(screen.getByRole('textbox', { name: 'Data' })).toHaveTextContent('[1, 2, 3, 4]')
	})

	it('shows each output tensor with its type, shape, and first values', () => {
		state.data = {
			outputTensors: {
				tensors: {
					embedding: {
						shape: [1n, 10n],
						tensor: { case: 'floatTensor', value: { data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] } },
					},
				},
			},
		}

		renderSubject()

		expect(screen.getByText('embedding')).toBeInTheDocument()
		const readoutValue = (label: string) => within(screen.getByRole('group', { name: label }))
		expect(readoutValue('Data type').getByText('float32')).toBeInTheDocument()
		expect(readoutValue('Shape').getByText('1, 10')).toBeInTheDocument()
		expect(
			readoutValue('First 8 values').getByText('1, 2, 3, 4, 5, 6, 7, 8, …')
		).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Copy JSON' })).toBeInTheDocument()
	})

	it("shows the mutation error in the section's error indicator", () => {
		state.error = new Error('model refused')

		renderSubject()

		expect(
			screen.getByRole('button', { name: 'Infer: 1 error, copy to clipboard' })
		).toBeInTheDocument()
	})
})

describe('MLModelService Infer widget in a 320 px pane', () => {
	it('does not scroll horizontally', () => {
		render(PaneSubject, { props: { widget: Subject } })
		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild
		if (!(root instanceof HTMLElement)) throw new Error('The widget rendered no root element')

		expect(getComputedStyle(pane).width).toBe(PANE_WIDTH)
		expect(root.scrollWidth, 'widget root').toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth, 'pane').toBeLessThanOrEqual(pane.clientWidth)
	})
})
