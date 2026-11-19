import type { Component, ComponentProps } from 'svelte'

import { render, screen, within } from '@testing-library/svelte'
import { robotApi } from '@viamrobotics/sdk'
import { describe, expect, it } from 'vitest'

import Subject from '../sessions-table.svelte'
import PaneFixture, { type InPaneProps } from './__fixtures__/in-pane.svelte'

const Pane: Component<InPaneProps<ComponentProps<typeof Subject>>> = PaneFixture

const NARROW_PX = 320
const WIDE_PX = 672

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
				localAddress,
			},
		})

	const renderSubject = (props: Partial<ComponentProps<typeof Subject>>, width: number = WIDE_PX) =>
		render(Pane, {
			props: {
				widget: Subject,
				width,
				props: { sessions: [], ourSessionId: undefined, ...props },
			},
		})

	it('displays a message when no sessions are available', () => {
		renderSubject({})

		expect(screen.getByText('No sessions currently available')).toBeInTheDocument()
	})

	it('renders a table with sessions', () => {
		const mockSessions = [
			createMockSession('1', robotApi.PeerConnectionType.GRPC, 'remote1', 'local1'),
			createMockSession('2', robotApi.PeerConnectionType.WEBRTC, 'remote2', 'local2'),
		]

		renderSubject({
			sessions: mockSessions,
		})

		expect(screen.getByRole('table')).toBeInTheDocument()
		// Header + 2 sessions
		expect(screen.getAllByRole('row')).toHaveLength(3)
	})

	it('displays session details correctly', () => {
		const mockSession = createMockSession(
			'test-id',
			robotApi.PeerConnectionType.GRPC,
			'test-remote',
			'test-local'
		)

		renderSubject({
			sessions: [mockSession],
		})

		const cells = screen.getAllByRole('cell')
		expect(cells[0]).toMatchTextContent('test-id')
		expect(cells[1]).toMatchTextContent('gRPC')
		expect(cells[2]).toMatchTextContent('test-remote')
		expect(cells[3]).toMatchTextContent('test-local')
	})

	it('renders each session as a row below @2xl, with an Ours badge on ours', () => {
		renderSubject(
			{
				sessions: [
					createMockSession('1', robotApi.PeerConnectionType.GRPC, 'remote1', 'local1'),
					createMockSession('2', robotApi.PeerConnectionType.WEBRTC, 'remote2', 'local2'),
				],
				ourSessionId: '2',
			},
			NARROW_PX
		)

		expect(screen.queryByRole('table')).not.toBeInTheDocument()
		const items = screen.getAllByRole('listitem')
		expect(items).toHaveLength(2)
		expect(items[0]).not.toMatchTextContent('Ours')
		expect(items[1]).toMatchTextContent('Ours')
		expect(items[1]).toMatchTextContent('WebRTC')
		expect(items[1]).toMatchTextContent('remote2')
		expect(items[1]).toMatchTextContent('local2')
		expect(within(items[1]).getByText('Ours')).toHaveClass('badge', 'badge-neutral')
	})

	it('keeps the narrow rows within 320 px', () => {
		renderSubject(
			{
				sessions: [
					createMockSession(
						'a-session-id-that-is-far-too-long-to-fit-in-a-pane',
						robotApi.PeerConnectionType.GRPC,
						'a-remote-address-that-is-far-too-long-to-fit-in-a-pane:443',
						'a-local-address-that-is-far-too-long-to-fit-in-a-pane:443'
					),
				],
			},
			NARROW_PX
		)

		const pane = screen.getByTestId('pane')
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})

	it('has no sideways scroll at 672 px', () => {
		renderSubject({
			sessions: [
				createMockSession(
					'a-session-id-that-is-far-too-long-to-fit-in-a-pane',
					robotApi.PeerConnectionType.GRPC,
					'remote',
					'local'
				),
			],
		})

		const pane = screen.getByTestId('pane')
		expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth)
	})

	it('highlights our session', () => {
		const mockSessions = [
			createMockSession('1', robotApi.PeerConnectionType.GRPC, 'remote1', 'local1'),
			createMockSession('2', robotApi.PeerConnectionType.WEBRTC, 'remote2', 'local2'),
		]

		renderSubject({
			sessions: mockSessions,
			ourSessionId: '2',
		})

		const rows = screen.getAllByRole('row')
		expect(rows[2]).toMatchTextContent('Ours')
	})

	it('sorts sessions by id', () => {
		const mockSessions = [
			createMockSession('2', robotApi.PeerConnectionType.GRPC, 'remote2', 'local2'),
			createMockSession('1', robotApi.PeerConnectionType.WEBRTC, 'remote1', 'local1'),
			createMockSession('3', robotApi.PeerConnectionType.GRPC, 'remote3', 'local3'),
		]

		renderSubject({
			sessions: mockSessions,
		})

		// Exclude header row
		const rows = screen.getAllByRole('row').slice(1)
		expect(rows[0]).toMatchTextContent('1')
		expect(rows[1]).toMatchTextContent('2')
		expect(rows[2]).toMatchTextContent('3')
	})
})
