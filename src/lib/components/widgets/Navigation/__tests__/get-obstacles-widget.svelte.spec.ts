import type { GeoGeometry } from '@viamrobotics/sdk'

import { render, screen, within } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../get-obstacles-widget.svelte'

const { queryState } = vi.hoisted(() => {
	const state: { data: GeoGeometry[] | undefined; error: Error | null } = {
		data: undefined,
		error: null,
	}
	return { queryState: state }
})

vi.mock('@viamrobotics/sdk', () => ({
	NavigationClient: class {},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		data: queryState.data,
		isLoading: queryState.data === undefined && queryState.error === null,
		isError: queryState.error !== null,
		error: queryState.error,
	})),
}))

const center = { x: 0, y: 0, z: 0, oX: 0, oY: 0, oZ: 1, theta: 45 }

const obstacle = (
	label: string,
	geometryType: GeoGeometry['geometries'][number]['geometryType']
): GeoGeometry => ({
	location: { latitude: 40.7129, longitude: -74.0057 },
	geometries: [{ center, geometryType, label }],
})

const box = obstacle('cone-1', {
	case: 'box',
	value: { dimsMm: { x: 2000, y: 1500, z: 1000 } },
})
const sphere = obstacle('ball', { case: 'sphere', value: { radiusMm: 2500 } })
const capsule = obstacle('pill', { case: 'capsule', value: { radiusMm: 500, lengthMm: 5000 } })

const renderSubject = () =>
	render(Subject, { props: { partID: 'test-part', resourceName: 'test-navigation' } })

const field = (label: string) => within(screen.getByRole('group', { name: label }))

describe('Navigation GetObstacles widget', () => {
	beforeEach(() => {
		queryState.data = undefined
		queryState.error = null
		vi.mocked(createResourceQuery).mockClear()
	})

	it('renders the GetObstacles heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetObstacles' })).toBeInTheDocument()
	})

	it('shows a box with its dimensions in meters, theta, and location', () => {
		queryState.data = [box]
		renderSubject()

		expect(screen.getByText('cone-1')).toBeInTheDocument()
		expect(screen.getByText('Box')).toBeInTheDocument()
		expect(field('Length').getByText('2.000')).toBeInTheDocument()
		expect(field('Width').getByText('1.500')).toBeInTheDocument()
		expect(field('Height').getByText('1.000')).toBeInTheDocument()
		expect(field('θ').getByText('45.00')).toBeInTheDocument()
		expect(field('Latitude').getByText('40.7129')).toBeInTheDocument()
		expect(field('Longitude').getByText('-74.0057')).toBeInTheDocument()
		expect(field('Length').getByText('m')).toBeInTheDocument()
		expect(field('Latitude').getByText('°')).toBeInTheDocument()
	})

	it('shows a sphere with its radius in meters', () => {
		queryState.data = [sphere]
		renderSubject()

		expect(screen.getByText('Sphere')).toBeInTheDocument()
		expect(field('Radius').getByText('2.500')).toBeInTheDocument()
		expect(field('Radius').getByText('m')).toBeInTheDocument()
	})

	it('shows a capsule with its radius and length in meters', () => {
		queryState.data = [capsule]
		renderSubject()

		expect(screen.getByText('Capsule')).toBeInTheDocument()
		expect(field('Radius').getByText('0.500')).toBeInTheDocument()
		expect(field('Length').getByText('5.000')).toBeInTheDocument()
	})

	it('labels an empty-label geometry Obstacle <n>, one-based', () => {
		queryState.data = [
			obstacle('', { case: 'sphere', value: { radiusMm: 1000 } }),
			obstacle('', { case: 'sphere', value: { radiusMm: 1000 } }),
		]
		renderSubject()

		expect(screen.getByText('Obstacle 1')).toBeInTheDocument()
		expect(screen.getByText('Obstacle 2')).toBeInTheDocument()
	})

	it('reads - when there are no obstacles', () => {
		queryState.data = []
		renderSubject()

		expect(
			within(screen.getByRole('group', { name: 'Obstacles' })).getByText('-')
		).toBeInTheDocument()
	})

	it('polls getObstacles every 1000 ms', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getObstacles', {
			refetchInterval: 1000,
		})
	})
})
