import { describe, expect, it } from 'vitest';
import type { ComponentProps } from 'svelte';
import { render, screen } from '@testing-library/svelte';

import { robotApi } from '@viamrobotics/sdk';

import Subject from '../sessions-table.svelte';

describe('SessionsTable', () => {
	const createMockSession = (
		id: string,
		type: robotApi.PeerConnectionType,
		remoteAddress: string,
		localAddress: string
	): robotApi.Session =>
		new robotApi.Session({
			id,
			peerConnectionInfo: {
				type,
				remoteAddress,
				localAddress
			}
		});

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
		render(Subject, {
			sessions: [],
			ourSessionId: undefined,
			...props
		});

	it('displays a message when no sessions are available', () => {
		renderSubject({});

		expect(screen.getByText('No sessions currently available')).toBeInTheDocument();
	});

	it('renders a table with sessions', () => {
		const mockSessions = [
			createMockSession('1', robotApi.PeerConnectionType.GRPC, 'remote1', 'local1'),
			createMockSession('2', robotApi.PeerConnectionType.WEBRTC, 'remote2', 'local2')
		];

		renderSubject({
			sessions: mockSessions
		});

		expect(screen.getByRole('table')).toBeInTheDocument();
		// Header + 2 sessions
		expect(screen.getAllByRole('row')).toHaveLength(3);
	});

	it('displays session details correctly', () => {
		const mockSession = createMockSession(
			'test-id',
			robotApi.PeerConnectionType.GRPC,
			'test-remote',
			'test-local'
		);

		renderSubject({
			sessions: [mockSession]
		});

		const cells = screen.getAllByRole('cell');
		expect(cells[0]).toHaveTextContent('test-id');
		expect(cells[1]).toHaveTextContent('gRPC');
		expect(cells[2]).toHaveTextContent('test-remote');
		expect(cells[3]).toHaveTextContent('test-local');
	});

	it('highlights our session', () => {
		const mockSessions = [
			createMockSession('1', robotApi.PeerConnectionType.GRPC, 'remote1', 'local1'),
			createMockSession('2', robotApi.PeerConnectionType.WEBRTC, 'remote2', 'local2')
		];

		renderSubject({
			sessions: mockSessions,
			ourSessionId: '2'
		});

		const rows = screen.getAllByRole('row');
		expect(rows[2]).toHaveTextContent('(Ours)');
	});

	it('sorts sessions by id', () => {
		const mockSessions = [
			createMockSession('2', robotApi.PeerConnectionType.GRPC, 'remote2', 'local2'),
			createMockSession('1', robotApi.PeerConnectionType.WEBRTC, 'remote1', 'local1'),
			createMockSession('3', robotApi.PeerConnectionType.GRPC, 'remote3', 'local3')
		];

		renderSubject({
			sessions: mockSessions
		});

		// Exclude header row
		const rows = screen.getAllByRole('row').slice(1);
		expect(rows[0]).toHaveTextContent('1');
		expect(rows[1]).toHaveTextContent('2');
		expect(rows[2]).toHaveTextContent('3');
	});
});
