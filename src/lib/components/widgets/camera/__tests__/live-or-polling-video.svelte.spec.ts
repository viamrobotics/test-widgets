import { render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'

import Subject from './live-or-polling-video.spec.svelte'

vi.mock('@viamrobotics/svelte-sdk', () => ({
	useRobotClient: vi.fn(() => ({ current: undefined })),
	createResourceClient: vi.fn(() => ({ current: undefined })),
	createResourceQuery: vi.fn(),
	createStreamClient: vi.fn(),
}))

const partID = 'test-part'
const resourceName = 'test-camera'

const topOffsetFromVideo = (element: HTMLElement) =>
	element.getBoundingClientRect().top -
	screen.getByLabelText(`${resourceName} stream`).getBoundingClientRect().top

describe('LiveOrPollingVideo', () => {
	it('keeps the error overlay on the video when its scroll container scrolls', async () => {
		render(Subject, {
			props: { partID, resourceName, error: new Error('no node found') },
		})
		const errorText = await screen.findByText('Error: no node found')
		const offsetBeforeScroll = topOffsetFromVideo(errorText)

		screen.getByTestId('scroller').scrollTop = 120

		expect(topOffsetFromVideo(errorText)).toBe(offsetBeforeScroll)
	})
})
