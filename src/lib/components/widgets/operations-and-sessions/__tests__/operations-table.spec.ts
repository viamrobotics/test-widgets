import type { Component, ComponentProps } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { robotApi } from '@viamrobotics/sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../operations-table.svelte'
import PaneFixture, { type InPaneProps } from './__fixtures__/in-pane.svelte'

const Pane: Component<InPaneProps<ComponentProps<typeof Subject>>> = PaneFixture

const NARROW_PX = 320
const WIDE_PX = 672

describe('OperationsTable', () => {
	let user: ReturnType<typeof userEvent.setup>
	let cancelOperation: (id: string) => void

	beforeEach(() => {
		user = userEvent.setup()
		cancelOperation = vi.fn()
	})

	const createMockOperation = (
		id: string,
		method: string,
		startedSeconds: number
	): robotApi.Operation =>
		new robotApi.Operation({
			id,
			sessionId: `session-${id}`,
			method,
			started: { seconds: BigInt(startedSeconds), nanos: 0 },
		})

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>>, width: number = WIDE_PX) =>
		render(Pane, {
			props: {
				widget: Subject,
				width,
				props: { operations: [], cancelOperation, ...props },
			},
		})

	it('displays a message when no operations are available', () => {
		renderSubject({})

		expect(screen.getByText('No operations currently available')).toBeInTheDocument()
	})

	it('renders a table with operations from @2xl', () => {
		const mockOperations = [
			createMockOperation('1', 'method1', 1000),
			createMockOperation('2', 'method2', 2000),
		]

		renderSubject({
			operations: mockOperations,
		})

		expect(screen.getByRole('table')).toBeInTheDocument()
		// Header + 2 operations
		expect(screen.getAllByRole('row')).toHaveLength(3)
	})

	it('names the kill column header Actions from @2xl', () => {
		renderSubject({ operations: [createMockOperation('1', 'method1', 1000)] })

		expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument()
	})

	it('renders each operation as a row below @2xl, with no table', () => {
		renderSubject({ operations: [createMockOperation('test-id', 'test-method', 5000)] }, NARROW_PX)

		expect(screen.queryByRole('table')).not.toBeInTheDocument()
		const item = screen.getByRole('listitem')
		expect(item).toMatchTextContent('test-method')
		expect(item).toMatchTextContent(/\d+\s*ms/u)
		expect(item).toMatchTextContent('Session session-test-id')
		expect(item).toMatchTextContent('Operation test-id')
	})

	it('keeps the narrow rows within 320 px', () => {
		renderSubject(
			{
				operations: [
					createMockOperation(
						'an-operation-id-that-is-far-too-long-to-fit-in-a-pane',
						'viam.component.arm.v1.ArmService/MoveThroughJointPositions',
						5000
					),
				],
			},
			NARROW_PX
		)

		const pane = screen.getByTestId('pane')
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})

	it('has no sideways scroll at 672 px', () => {
		renderSubject({ operations: [createMockOperation('test-id', 'test-method', 5000)] })

		const pane = screen.getByTestId('pane')
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})

	it('displays operation details correctly', () => {
		const mockOperation = createMockOperation('test-id', 'test-method', 5000)

		renderSubject({
			operations: [mockOperation],
		})

		const cells = screen.getAllByRole('cell')
		expect(cells[0]).toMatchTextContent('test-id')
		expect(cells[1]).toMatchTextContent('session-test-id')
		expect(cells[2]).toMatchTextContent('test-method')
		expect(cells[3]).toMatchTextContent(/\d+\s*ms/u)
	})

	it('calls cancelOperation when Kill button is clicked', async () => {
		const mockOperation = createMockOperation('test-id', 'test-method', 1000)

		renderSubject({
			operations: [mockOperation],
		})

		const killButton = screen.getByRole('button', { name: 'Kill' })
		await user.click(killButton)

		expect(cancelOperation).toHaveBeenCalledWith('test-id')
	})

	it('sorts operations by elapsed time in descending order', () => {
		const mockOperations = [
			createMockOperation('op-1', 'method1', 1000),
			createMockOperation('op-2', 'method2', 3000),
			createMockOperation('op-3', 'method3', 2000),
		]

		renderSubject({
			operations: mockOperations,
		})

		// Exclude header row
		const rows = screen.getAllByRole('row').slice(1)
		expect(rows[0]).toMatchTextContent('op-1')
		expect(rows[1]).toMatchTextContent('op-3')
		expect(rows[2]).toMatchTextContent('op-2')
	})
})
