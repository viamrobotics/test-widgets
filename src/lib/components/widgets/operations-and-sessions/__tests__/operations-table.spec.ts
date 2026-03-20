import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'svelte';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

import { robotApi } from '@viamrobotics/sdk';

import Subject from '../operations-table.svelte';

describe('OperationsTable', () => {
	let user: ReturnType<typeof userEvent.setup>;
	let cancelOperation: (id: string) => void;

	beforeEach(() => {
		user = userEvent.setup();
		cancelOperation = vi.fn();
	});

	const createMockOperation = (
		id: string,
		method: string,
		startedSeconds: number
	): robotApi.Operation =>
		new robotApi.Operation({
			id,
			sessionId: `session-${id}`,
			method,
			started: { seconds: BigInt(startedSeconds), nanos: 0 }
		});

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
		render(Subject, {
			operations: [],
			cancelOperation,
			...props
		});

	it('displays a message when no operations are available', () => {
		renderSubject({});

		expect(screen.getByText('No operations currently available')).toBeInTheDocument();
	});

	it('renders a table with operations when operations are available', () => {
		const mockOperations = [
			createMockOperation('1', 'method1', 1000),
			createMockOperation('2', 'method2', 2000)
		];

		renderSubject({
			operations: mockOperations
		});

		expect(screen.getByRole('table')).toBeInTheDocument();
		// Header + 2 operations
		expect(screen.getAllByRole('row')).toHaveLength(3);
	});

	it('displays operation details correctly', () => {
		const mockOperation = createMockOperation('test-id', 'test-method', 5000);

		renderSubject({
			operations: [mockOperation]
		});

		const cells = screen.getAllByRole('cell');
		expect(cells[0]).toHaveTextContent('test-id');
		expect(cells[1]).toHaveTextContent('session-test-id');
		expect(cells[2]).toHaveTextContent('test-method');
		expect(cells[3]).toHaveTextContent(/\d+ ms/u);
	});

	it('calls cancelOperation when Kill button is clicked', async () => {
		const mockOperation = createMockOperation('test-id', 'test-method', 1000);

		renderSubject({
			operations: [mockOperation]
		});

		const killButton = screen.getByRole('button', { name: 'Kill' });
		await user.click(killButton);

		expect(cancelOperation).toHaveBeenCalledWith('test-id');
	});

	it('sorts operations by elapsed time in descending order', () => {
		const mockOperations = [
			createMockOperation('op-1', 'method1', 1000),
			createMockOperation('op-2', 'method2', 3000),
			createMockOperation('op-3', 'method3', 2000)
		];

		renderSubject({
			operations: mockOperations
		});

		// Exclude header row
		const rows = screen.getAllByRole('row').slice(1);
		expect(rows[0]).toHaveTextContent('op-1');
		expect(rows[1]).toHaveTextContent('op-3');
		expect(rows[2]).toHaveTextContent('op-2');
	});
});
