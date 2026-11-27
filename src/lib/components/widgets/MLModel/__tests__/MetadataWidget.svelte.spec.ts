import { fireEvent, render, screen } from '@testing-library/svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../MetadataWidget.svelte'
import Pane from './__fixtures__/In320Pane.svelte'

interface FileFixture {
	name: string
	description: string
	labelType: number
}

interface TensorFixture {
	name: string
	description: string
	dataType: string
	shape: number[]
	associatedFiles: FileFixture[]
}

interface MetadataFixture {
	name: string
	description: string
	type: string
	inputInfo: TensorFixture[]
	outputInfo: TensorFixture[]
}

const { queryState, requestedOptions } = vi.hoisted(() => {
	const state: { data: { metadata: MetadataFixture } | undefined; error: Error | null } = {
		data: undefined,
		error: null,
	}
	const options: unknown[] = []
	return { queryState: state, requestedOptions: options }
})

vi.mock('@viamrobotics/sdk', () => ({
	MLModelClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn((_client: unknown, _method: string, options: unknown) => {
		requestedOptions.push(typeof options === 'function' ? options() : options)
		return {
			data: queryState.data,
			isLoading: queryState.data === undefined && queryState.error === null,
			isError: queryState.error !== null,
			error: queryState.error,
		}
	}),
}))

const tensor = (overrides: Partial<TensorFixture> = {}): TensorFixture => ({
	name: '',
	description: '',
	dataType: 'float32',
	shape: [],
	associatedFiles: [],
	...overrides,
})

const metadata = (overrides: Partial<MetadataFixture> = {}): { metadata: MetadataFixture } => ({
	metadata: {
		name: '',
		description: '',
		type: '',
		inputInfo: [],
		outputInfo: [],
		...overrides,
	},
})

const renderSubject = () =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-ml-model' } })

describe('ML model Metadata widget', () => {
	beforeEach(() => {
		queryState.data = undefined
		queryState.error = null
		requestedOptions.length = 0
	})

	it('renders the Metadata section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'Metadata' })).toBeInTheDocument()
	})

	it('renders the model name, type, and description', () => {
		queryState.data = metadata({ name: 'resnet-50', type: 'tflite', description: 'Classifies' })

		renderSubject()

		expect(screen.getByRole('group', { name: 'Name' })).toHaveTextContent('Name resnet-50')
		expect(screen.getByRole('group', { name: 'Type' })).toHaveTextContent('Type tflite')
		expect(screen.getByRole('group', { name: 'Description' })).toHaveTextContent(
			'Description Classifies'
		)
	})

	it('reads a missing model name, type, and description as a dash', () => {
		queryState.data = metadata()

		renderSubject()

		expect(screen.getByRole('group', { name: 'Name' })).toHaveTextContent('Name -')
		expect(screen.getByRole('group', { name: 'Type' })).toHaveTextContent('Type -')
		expect(screen.getByRole('group', { name: 'Description' })).toHaveTextContent('Description -')
	})

	it('titles tensors by name, or by 1-based position when they have none', () => {
		queryState.data = metadata({
			inputInfo: [tensor({ name: 'image' }), tensor()],
			outputInfo: [tensor(), tensor({ name: 'scores' }), tensor()],
		})

		renderSubject()

		for (const title of ['image', 'Input 2', 'Output 1', 'scores', 'Output 3']) {
			expect(screen.getByText(title)).toBeInTheDocument()
		}
		expect(screen.queryByText('Input 1')).toBeNull()
	})

	it('labels the input and output groups as headings below the section heading', () => {
		queryState.data = metadata()

		renderSubject()

		expect(screen.getByRole('heading', { name: 'Inputs', level: 4 })).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: 'Outputs', level: 4 })).toBeInTheDocument()
	})

	it('formats the shape with multiplication signs and a dash when empty', () => {
		queryState.data = metadata({
			inputInfo: [tensor({ name: 'image', shape: [1, 224, 224, 3] }), tensor({ name: 'flat' })],
		})

		renderSubject()

		const shapes = screen.getAllByRole('group', { name: 'Shape' })
		expect(shapes[0]).toHaveTextContent('Shape 1 × 224 × 224 × 3')
		expect(shapes[1]).toHaveTextContent('Shape -')
	})

	it('shows each tensor data type and description', () => {
		queryState.data = metadata({
			inputInfo: [tensor({ name: 'image', dataType: 'uint8', description: 'RGB frame' })],
		})

		renderSubject()

		expect(screen.getByRole('group', { name: 'Data type' })).toHaveTextContent('Data type uint8')
		expect(screen.getAllByRole('group', { name: 'Description' })[1]).toHaveTextContent(
			'Description RGB frame'
		)
	})

	it('lists associated files with their name and label type', () => {
		queryState.data = metadata({
			outputInfo: [
				tensor({
					name: 'scores',
					associatedFiles: [
						{ name: 'labels.txt', description: '', labelType: 1 },
						{ name: 'axis.txt', description: '', labelType: 2 },
					],
				}),
			],
		})

		renderSubject()

		expect(screen.getByText(/labels\.txt/u)).toHaveTextContent('labels.txt · Tensor value')
		expect(screen.getByText(/axis\.txt/u)).toHaveTextContent('axis.txt · Tensor axis')
	})

	it('reads once, with no polling', () => {
		renderSubject()

		expect(requestedOptions[0]).toEqual({ refetchInterval: false })
	})

	it("shows the query error in the section's error indicator", async () => {
		queryState.error = new Error('model metadata unavailable')

		renderSubject()
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'Metadata: 1 error, copy to clipboard' })
		)

		expect(screen.getByText(/model metadata unavailable/iu)).toBeInTheDocument()
	})

	it('keeps the root and the pane within 320 px', () => {
		queryState.data = metadata({
			name: 'a-very-long-model-name-without-any-breaks-at-all-to-wrap',
			description: 'x'.repeat(200),
			inputInfo: [
				tensor({
					name: 'tensor-with-a-very-long-name-that-should-truncate-or-wrap',
					shape: [1, 224, 224, 3],
					associatedFiles: [{ name: `${'f'.repeat(120)}.txt`, description: '', labelType: 1 }],
				}),
			],
		})

		const { container } = render(Pane, { props: { widget: Subject } })

		const pane = screen.getByTestId('pane')
		const root = pane.firstElementChild ?? container
		expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth)
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})
})
