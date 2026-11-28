import { render, screen } from '@testing-library/svelte'
import { createResourceQuery } from '@viamrobotics/svelte-sdk'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../GetPropertiesWidget.svelte'

interface Properties {
	cloudSlam: boolean
	mappingMode: number
	internalStateFileType?: string
	sensorInfo: { name: string; type: number }[]
}

const { queryState } = vi.hoisted(() => {
	const state: { data: Properties | undefined } = { data: undefined }
	return { queryState: state }
})

vi.mock('@viamrobotics/sdk', () => ({
	SlamClient: class {},
	slamApi: {
		MappingMode: {
			UNSPECIFIED: 0,
			CREATE_NEW_MAP: 1,
			LOCALIZE_ONLY: 2,
			UPDATE_EXISTING_MAP: 3,
		},
		SensorType: { UNSPECIFIED: 0, CAMERA: 1, MOVEMENT_SENSOR: 2 },
	},
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceQuery: vi.fn(() => ({
		data: queryState.data,
		isLoading: false,
		isError: false,
		error: null,
	})),
}))

const properties = (overrides: Partial<Properties> = {}): Properties => ({
	cloudSlam: false,
	mappingMode: 2,
	internalStateFileType: 'pbstream',
	sensorInfo: [],
	...overrides,
})

const renderSubject = () =>
	render(Subject, {
		props: { partID: 'test-part', resourceName: 'test-slam' },
	})

describe('SLAM GetProperties widget', () => {
	beforeEach(() => {
		queryState.data = undefined
		vi.mocked(createResourceQuery).mockClear()
	})

	it('renders the GetProperties section heading', () => {
		renderSubject()

		expect(screen.getByRole('heading', { name: 'GetProperties' })).toBeInTheDocument()
	})

	it('reads once', () => {
		renderSubject()

		expect(createResourceQuery).toHaveBeenCalledWith(expect.anything(), 'getProperties', {
			refetchInterval: false,
		})
	})

	it.each([
		[1, 'Create new map'],
		[2, 'Localize only'],
		[3, 'Update existing map'],
	])('labels mapping mode %i as %s', (mappingMode, label) => {
		queryState.data = properties({ mappingMode })

		renderSubject()

		expect(screen.getByText(label)).toBeInTheDocument()
	})

	it('shows Cloud SLAM as Yes with a dot', () => {
		queryState.data = properties({ cloudSlam: true })

		renderSubject()

		expect(screen.getByRole('img', { name: 'Yes' })).toBeInTheDocument()
		expect(screen.getByText('Yes')).toBeInTheDocument()
	})

	it('shows Cloud SLAM as No with a dot', () => {
		queryState.data = properties({ cloudSlam: false })

		renderSubject()

		expect(screen.getByRole('img', { name: 'No' })).toBeInTheDocument()
		expect(screen.getByText('No')).toBeInTheDocument()
	})

	it('shows the internal state file type', () => {
		queryState.data = properties()

		renderSubject()

		expect(screen.getByText('pbstream')).toBeInTheDocument()
	})

	it('renders a row per sensor with its type', () => {
		queryState.data = properties({
			sensorInfo: [
				{ name: 'lidar-1', type: 1 },
				{ name: 'imu-1', type: 2 },
			],
		})

		renderSubject()

		const items = screen.getAllByRole('listitem')

		expect(items).toHaveLength(2)
		expect(items[0]).toMatchTextContent('lidar-1')
		expect(items[0]).toMatchTextContent('Camera')
		expect(items[1]).toMatchTextContent('imu-1')
		expect(items[1]).toMatchTextContent('Movement sensor')
	})

	it('reads - for every missing value', () => {
		renderSubject()

		expect(screen.getAllByText('-')).toHaveLength(4)
		expect(screen.queryByRole('img', { name: /Cloud SLAM/u })).not.toBeInTheDocument()
	})

	it('reads - for an unspecified mapping mode and an empty file type', () => {
		queryState.data = properties({ mappingMode: 0, internalStateFileType: undefined })

		renderSubject()

		expect(screen.getAllByText('-')).toHaveLength(3)
	})
})
