import { render, screen } from '@testing-library/svelte'
import { userEvent } from '@testing-library/user-event'
import { robotApi } from '@viamrobotics/sdk'
import { createRawSnippet } from 'svelte'
import { describe, expect, it, vi } from 'vitest'

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

vi.mock('$lib/components/widgets/operations-and-sessions/operations-and-sessions.svelte', () => ({
	default: () => {},
}))

vi.mock('../card-list-item.svelte', () => ({
	default: () => {},
	collapseAll: () => {},
	expandAll: () => {},
}))

const children = createRawSnippet(() => ({ render: () => '<div></div>' }))

describe('Widgets', () => {
	it('names the single card switch after its label', () => {
		render(Subject, { partID: 'part-a', urlHash: '', children })

		expect(screen.getByRole('switch', { name: /single card mode/iu })).toBeInTheDocument()
	})

	it('shows the full resource list again after switching machines in single card mode', async () => {
		const user = userEvent.setup()
		const { rerender } = render(Subject, { partID: 'part-a', urlHash: '', children })
		await user.click(screen.getByRole('switch', { name: /single card mode/iu }))
		await user.click(screen.getByRole('link', { name: /cam-a1/iu }))

		await rerender({ partID: 'part-b' })

		expect(screen.queryByText(/no resources on this part/iu)).not.toBeInTheDocument()
		expect(screen.getByRole('button', { name: /collapse all/iu })).toBeInTheDocument()
	})
})
