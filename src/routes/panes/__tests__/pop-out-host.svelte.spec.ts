import { render, screen, waitFor, within } from '@testing-library/svelte'
import { userEvent } from '@testing-library/user-event'
import { robotApi } from '@viamrobotics/sdk'
import { describe, expect, it, vi } from 'vitest'

import Subject from './__fixtures__/sized-pane-playground.svelte'

vi.mock('@viamrobotics/svelte-sdk', async (importOriginal) => ({
	...(await importOriginal<typeof import('@viamrobotics/svelte-sdk')>()),
	useConnectionStatus: () => ({ current: 'connected' }),
	useResourceStatuses: () => ({ current: [] }),
	useMachineStatus: () => ({
		query: { isPending: false, error: null },
		current: {
			resources: [
				{
					name: { name: 'arm-1', namespace: 'rdk', type: 'component', subtype: 'arm' },
					state: robotApi.ResourceStatus_State.READY,
					revision: '1',
					error: '',
				},
			],
		},
	}),
}))

vi.mock('$lib/registry', async (importOriginal) => {
	const { default: PopOutControl } = await import('./__fixtures__/pop-out-control.svelte')
	return {
		...(await importOriginal<typeof import('$lib/registry')>()),
		widgetForResource: () => PopOutControl,
		widgetSizeForResource: () => ({
			minWidth: 200,
			minHeight: 120,
			recommendedWidths: [200],
			maxWidth: 400,
		}),
	}
})

const SCENE_TITLE = 'arm-1 › Scene'

const sceneWindow = () => screen.getByRole('dialog', { name: SCENE_TITLE })

const openScene = async () => {
	const user = userEvent.setup()
	render(Subject)
	await user.click(screen.getByRole('button', { name: 'Open scene' }))
	await waitFor(() => {
		expect(sceneWindow()).toBeVisible()
	})
	return user
}

describe('Pane playground pop-out host', () => {
	it("opens a floating window titled with the request's title around its content", async () => {
		await openScene()

		const scene = within(sceneWindow())
		expect(scene.getByRole('heading', { name: SCENE_TITLE })).toBeVisible()
		expect(scene.getByText('scene body')).toBeVisible()
	})

	it('gives the content a body no smaller than the requested minimum', async () => {
		await openScene()

		const body = screen.getByText('scene body').getBoundingClientRect()
		expect(
			{ width: body.width, height: body.height },
			'the frame adds 2 px of border and a 33 px header around the 672 x 504 body'
		).toEqual({ width: 672, height: 504 })
	})

	it('removes the window without calling onClose when the control closes it', async () => {
		const user = await openScene()

		await user.click(screen.getByRole('button', { name: 'Close scene from control' }))

		expect(screen.queryByRole('dialog', { name: SCENE_TITLE })).toBeNull()
		expect(screen.getByRole('status', { name: 'Host closes' })).toHaveTextContent('0')
	})

	it('removes the window and calls onClose once when its own Close is pressed', async () => {
		const user = await openScene()

		await user.click(within(sceneWindow()).getByRole('button', { name: `Close ${SCENE_TITLE}` }))

		expect(screen.queryByRole('dialog', { name: SCENE_TITLE })).toBeNull()
		expect(screen.getByRole('status', { name: 'Host closes' })).toHaveTextContent('1')
	})

	it('ignores the control closing a window its own Close already closed', async () => {
		const user = await openScene()
		await user.click(within(sceneWindow()).getByRole('button', { name: `Close ${SCENE_TITLE}` }))

		await user.click(screen.getByRole('button', { name: 'Close scene from control' }))

		expect(screen.queryByRole('dialog', { name: SCENE_TITLE })).toBeNull()
		expect(screen.getByRole('status', { name: 'Host closes' })).toHaveTextContent('1')
	})
})
