import { render, screen } from '@testing-library/svelte'
import { userEvent } from '@testing-library/user-event'
import { robotApi } from '@viamrobotics/sdk'
import { createRawSnippet } from 'svelte'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Subject from '../widgets.svelte'

const cameraStatus = (name: string) => ({
	name: { name, namespace: 'rdk', type: 'component', subtype: 'camera' },
	state: robotApi.ResourceStatus_State.READY,
	revision: '1',
	error: '',
})

const resourcesByPart: Record<string, ReturnType<typeof cameraStatus>[]> = {
	'part-a': [cameraStatus('cam-a1'), cameraStatus('cam-a2')],
	'part-b': [cameraStatus('cam-b1'), cameraStatus('cam-b2')],
}

vi.mock('@viamrobotics/svelte-sdk', async (importOriginal) => ({
	...(await importOriginal<typeof import('@viamrobotics/svelte-sdk')>()),
	useConnectionStatus: () => ({ current: 'connected' }),
	useMachineStatus: (getPartID: () => string) => ({
		query: { isPending: false, error: undefined },
		get current() {
			return { resources: resourcesByPart[getPartID()] ?? [] }
		},
	}),
}))

const drawer = vi.hoisted(() => ({ mounted: 0 }))

vi.mock('#lib/components/widgets/OperationsAndSessions/OperationsAndSessions.svelte', () => ({
	default: () => {
		drawer.mounted += 1
	},
}))

vi.mock('../card-list-item.svelte', () => ({
	default: () => {},
	collapseAll: () => {},
	expandAll: () => {},
}))

const children = createRawSnippet(() => ({ render: () => '<div></div>' }))

describe('Widgets', () => {
	beforeEach(() => {
		drawer.mounted = 0
	})

	it('names the single card checkbox after its label', () => {
		render(Subject, { partID: 'part-a', urlHash: '', children })

		expect(screen.getByRole('checkbox', { name: /single card mode/iu })).toBeInTheDocument()
	})

	it('shows the full resource list again after switching machines in single card mode', async () => {
		const user = userEvent.setup()
		const { rerender } = render(Subject, { partID: 'part-a', urlHash: '', children })
		await user.click(screen.getByRole('checkbox', { name: /single card mode/iu }))
		await user.click(screen.getByRole('link', { name: /cam-a1/iu }))

		await rerender({ partID: 'part-b' })

		expect(screen.queryByText(/no resources on this part/iu)).not.toBeInTheDocument()
		expect(screen.getByRole('button', { name: /collapse all/iu })).toBeInTheDocument()
	})

	it('opens and closes the operations and sessions drawer', async () => {
		const user = userEvent.setup()
		render(Subject, { partID: 'part-a', urlHash: '', children })
		const toggle = screen.getByRole('button', { name: /operations and sessions/iu })
		const body = document.querySelector(`[id="${toggle.getAttribute('aria-controls')}"]`)

		expect(toggle).toHaveAttribute('aria-expanded', 'false')
		expect(body).toHaveAttribute('hidden')
		expect(drawer.mounted).toBe(0)

		await user.click(toggle)

		expect(toggle).toHaveAttribute('aria-expanded', 'true')
		expect(body).not.toHaveAttribute('hidden')
		expect(drawer.mounted).toBe(1)

		await user.click(toggle)

		expect(toggle).toHaveAttribute('aria-expanded', 'false')
		expect(body).toHaveAttribute('hidden')
	})
})
