import type { ComponentProps } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import { robotApi } from '@viamrobotics/sdk'
import { describe, expect, it } from 'vitest'

import Subject from '../resource-list.svelte'

describe('Sidebar ResourceList', () => {
	const renderSubject = (props: Partial<ComponentProps<typeof Subject>>) =>
		render(Subject, {
			isLoading: false,
			error: null,
			resources: [],
			...props,
		})

	it('shows loading state', () => {
		renderSubject({
			isLoading: true,
		})

		const cameraLink = screen.queryByRole('link', { name: /fake-camera/iu })
		const loadingIndicator = screen.getByRole('progressbar')

		expect(cameraLink).not.toBeInTheDocument()
		expect(loadingIndicator).toBeInTheDocument()
	})

	it('shows an error', () => {
		renderSubject({
			error: new Error('uh oh spaghettios'),
		})

		const error = screen.getByText(/uh oh spaghettios/iu)

		expect(error).toBeInTheDocument()
	})

	it('shows links for resources', () => {
		renderSubject({
			resources: [
				{
					name: {
						name: 'fake-camera',
						namespace: 'rdk',
						type: 'component',
						subtype: 'camera',
					},
					state: robotApi.ResourceStatus_State.READY,
					revision: '1',
					error: '',
				},
				{
					name: {
						name: 'fake-sensor',
						namespace: 'rdk',
						type: 'component',
						subtype: 'sensor',
					},
					state: robotApi.ResourceStatus_State.READY,
					revision: '1',
					error: '',
				},
				{
					name: {
						name: 'fake-nav',
						namespace: 'rdk',
						type: 'service',
						subtype: 'navigation',
					},
					state: robotApi.ResourceStatus_State.READY,
					revision: '1',
					error: '',
				},
			],
		})

		const cameraLink = screen.getByRole('link', { name: /fake-camera/iu })
		const sensorLink = screen.getByRole('link', { name: /fake-sensor/iu })
		const navLink = screen.getByRole('link', { name: /fake-nav/iu })

		expect(cameraLink).toHaveAttribute('href', '#fake-camera')
		expect(sensorLink).toHaveAttribute('href', '#fake-sensor')
		expect(navLink).toHaveAttribute('href', '#fake-nav')
	})
})
