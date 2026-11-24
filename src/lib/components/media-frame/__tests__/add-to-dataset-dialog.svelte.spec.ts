import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { SectionErrorReporter } from '../../section/section-error-reporter'
import type { MediaFrameAddToDataset, MediaFrameCapture } from '../media-frame-capture'

import Host from './__fixtures__/media-frame-host.svelte'

const PNG_CAPTURE: MediaFrameCapture = {
	binaryData: new Uint8Array([137, 80, 78]),
	mimeType: 'image/png',
}

const createAddToDataset = (
	overrides: Partial<MediaFrameAddToDataset> = {}
): MediaFrameAddToDataset => ({
	capture: async () => PNG_CAPTURE,
	onConfirm: async () => {},
	resourceName: 'camera-1',
	methodName: 'getImages',
	...overrides,
})

const openDialog = async (user: ReturnType<typeof userEvent.setup>) => {
	await user.click(screen.getByRole('button', { name: 'Add to dataset' }))
	return screen.findByRole('dialog', { name: 'Add to dataset' })
}

const waitForPreview = () => screen.findByRole('img', { name: 'Captured frame from camera-1' })

const recordingReporter = () => {
	const reported: (() => Error | null)[] = []
	const reporter: SectionErrorReporter = {
		report: (getError) => {
			reported.push(getError)
			return () => {}
		},
	}
	return { reporter, messages: () => reported.map((getError) => getError()?.message) }
}

describe('AddToDatasetDialog without a form', () => {
	it('previews the captured frame and names its resource, method, and mime type', async () => {
		const user = userEvent.setup()
		render(Host, { props: { addToDataset: createAddToDataset() } })

		const dialog = await openDialog(user)

		expect(await waitForPreview()).toHaveAttribute('src', expect.stringMatching(/^blob:/))
		expect(dialog).toHaveAccessibleDescription('camera-1 · getImages · image/png')
	})

	it('focuses Cancel on open', async () => {
		const user = userEvent.setup()
		render(Host, { props: { addToDataset: createAddToDataset() } })

		await openDialog(user)
		await waitForPreview()

		await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus())
	})

	it('sends the capture to onConfirm, then closes', async () => {
		const user = userEvent.setup()
		const onConfirm = vi.fn<(capture: MediaFrameCapture) => Promise<void>>(async () => {})
		render(Host, { props: { addToDataset: createAddToDataset({ onConfirm }) } })
		await openDialog(user)
		await waitForPreview()

		await user.click(screen.getByRole('button', { name: 'Add' }))

		expect(onConfirm).toHaveBeenCalledWith(PNG_CAPTURE)
		await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
	})

	it('returns focus to the Add to dataset button on close', async () => {
		const user = userEvent.setup()
		render(Host, { props: { addToDataset: createAddToDataset() } })
		await openDialog(user)
		await waitForPreview()

		await user.click(screen.getByRole('button', { name: 'Cancel' }))

		await vi.waitFor(() =>
			expect(screen.getByRole('button', { name: 'Add to dataset' })).toHaveFocus()
		)
	})

	it('revokes the preview URL on close', async () => {
		const user = userEvent.setup()
		const revoke = vi.spyOn(URL, 'revokeObjectURL')
		render(Host, { props: { addToDataset: createAddToDataset() } })
		await openDialog(user)
		const preview = await waitForPreview()
		const previewUrl = preview.getAttribute('src')

		await user.keyboard('{Escape}')

		await vi.waitFor(() => expect(revoke).toHaveBeenCalledWith(previewUrl))
	})
})

describe('AddToDatasetDialog with a form', () => {
	it('renders the form with the frame, resource, and method', async () => {
		const user = userEvent.setup()
		render(Host, { props: { addToDataset: createAddToDataset(), withForm: true } })

		await openDialog(user)

		expect(await screen.findByTestId('form-props')).toHaveTextContent(
			'camera-1 getImages image/png 3 bytes'
		)
	})

	it("focuses the form's first field on open", async () => {
		const user = userEvent.setup()
		render(Host, { props: { addToDataset: createAddToDataset(), withForm: true } })

		await openDialog(user)

		await vi.waitFor(() => expect(screen.getByRole('textbox', { name: 'Dataset' })).toHaveFocus())
	})
})

describe('AddToDatasetDialog confirm', () => {
	it('keeps the dialog open with a danger banner when the host rejects', async () => {
		const user = userEvent.setup()
		const onConfirm = async () => {
			throw new Error('permission denied')
		}
		render(Host, { props: { addToDataset: createAddToDataset({ onConfirm }) } })
		const dialog = await openDialog(user)
		await waitForPreview()

		await user.click(screen.getByRole('button', { name: 'Add' }))

		expect(await screen.findByRole('alert')).toHaveTextContent(
			'Error: Could not add to dataset permission denied'
		)
		expect(dialog).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled()
	})

	it('disables Cancel and ignores Escape while the host is adding', async () => {
		const user = userEvent.setup()
		const onConfirm = () => new Promise<void>(() => {})
		render(Host, { props: { addToDataset: createAddToDataset({ onConfirm }) } })
		const dialog = await openDialog(user)
		await waitForPreview()
		await user.click(screen.getByRole('button', { name: 'Add' }))

		await user.keyboard('{Escape}')

		expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
		expect(screen.getByRole('button', { name: 'Adding' })).toHaveAttribute('aria-busy', 'true')
		expect(dialog).toBeInTheDocument()
	})
})

describe('AddToDatasetDialog capture', () => {
	it('reports a failed capture to the section and keeps Add disabled', async () => {
		const user = userEvent.setup()
		const { reporter, messages } = recordingReporter()
		const capture = async (): Promise<MediaFrameCapture> => {
			throw new Error('GetImages timed out')
		}
		render(Host, { props: { reporter, addToDataset: createAddToDataset({ capture }) } })

		await openDialog(user)

		await vi.waitFor(() => expect(messages()).toContain('GetImages timed out'))
		expect(screen.getByText('The frame could not be captured.')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()
	})
})
