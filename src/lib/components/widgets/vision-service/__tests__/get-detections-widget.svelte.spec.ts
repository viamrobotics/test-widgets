import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte'
import { Detection } from '@viamrobotics/sdk'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../get-detections-widget.svelte'
import {
	chooseFile,
	createImageFile,
	IMAGE_HEIGHT,
	IMAGE_WIDTH,
} from './__fixtures__/choose-image-file'
import PaneSubject from './__fixtures__/in-320-pane.svelte'

const state = vi.hoisted((): { mutate: Mock; response: unknown; error: Error | null } => ({
	mutate: vi.fn(),
	response: [],
	error: null,
}))

vi.mock('@viamrobotics/svelte-sdk', () => ({
	createResourceClient: vi.fn(() => ({ current: {} })),
	createResourceMutation: vi.fn(() => ({
		mutate: state.mutate,
		isPending: false,
		get error() {
			return state.error
		},
	})),
}))

const PROPS = { partID: 'test-part', resourceName: 'test-vision' }

const PERSON = new Detection({
	xMin: 100n,
	yMin: 60n,
	xMax: 300n,
	yMax: 210n,
	confidence: 0.924,
	className: 'person',
})

const executeButton = () => screen.getByRole('button', { name: 'Execute' })

const chooseImage = async (container: HTMLElement) => {
	const file = await createImageFile()
	await chooseFile(container, file)
	await waitFor(() => expect(executeButton()).toBeEnabled())
	return file
}

describe('GetDetections widget', () => {
	beforeEach(() => {
		state.mutate.mockReset()
		state.mutate.mockImplementation(
			(_args: unknown, options?: { onSuccess?: (data: unknown) => void }) => {
				options?.onSuccess?.(state.response)
			}
		)
		state.response = []
		state.error = null
	})

	it('marks a file that is not a JPEG or PNG invalid and holds Execute back', async () => {
		const { container } = render(Subject, { props: PROPS })

		await chooseFile(container, new File(['text'], 'notes.txt', { type: 'text/plain' }))

		expect(await screen.findByLabelText('Image')).toBeInvalid()
		expect(
			screen.getByText('notes.txt is not a JPEG or PNG image', {
				selector: '[role="tooltip"] *, *',
			})
		).toBeInTheDocument()
		expect(executeButton()).toBeDisabled()
	})

	it('holds Execute back until an image is chosen', () => {
		render(Subject, { props: PROPS })

		expect(screen.getByLabelText('Image')).toBeInTheDocument()
		expect(executeButton()).toBeDisabled()
	})

	it('sends nothing when an image is chosen, only on Execute', async () => {
		const { container } = render(Subject, { props: PROPS })

		await chooseImage(container)

		expect(executeButton()).toBeEnabled()
		expect(state.mutate).not.toHaveBeenCalled()
	})

	it("sends the file's bytes, natural width and height, and mime type on Execute", async () => {
		const { container } = render(Subject, { props: PROPS })
		const file = await chooseImage(container)

		await fireEvent.click(executeButton())

		const bytes = new Uint8Array(await file.arrayBuffer())
		expect(state.mutate).toHaveBeenCalledTimes(1)
		expect(state.mutate.mock.calls[0]?.[0]).toEqual([bytes, IMAGE_WIDTH, IMAGE_HEIGHT, 'image/png'])
	})

	it('draws a row for each detection in the response', async () => {
		state.response = [PERSON]
		const { container } = render(Subject, { props: PROPS })
		await chooseImage(container)

		await fireEvent.click(executeButton())

		expect(
			within(screen.getByRole('list', { name: 'Detections' })).getByRole('listitem')
		).toHaveTextContent('person 92.40 % (100, 60) to (300, 210)')
	})

	it('reads - and draws no image before Execute', () => {
		render(Subject, { props: PROPS })

		expect(screen.getByRole('group', { name: 'Detections' })).toHaveTextContent('Detections -')
		expect(screen.queryByRole('img')).not.toBeInTheDocument()
	})

	it("shows the GetDetections error in the section's error indicator", async () => {
		state.error = new Error('model failed to load')

		render(Subject, { props: PROPS })
		await fireEvent.focusIn(
			screen.getByRole('button', { name: 'GetDetections: 1 error, copy to clipboard' })
		)

		expect(screen.getByText(/model failed to load/iu)).toBeInTheDocument()
	})
})

describe('GetDetections widget in a 320 px pane', () => {
	beforeEach(() => {
		state.mutate.mockReset()
		state.mutate.mockImplementation(
			(_args: unknown, options?: { onSuccess?: (data: unknown) => void }) => {
				options?.onSuccess?.(state.response)
			}
		)
		state.response = [PERSON]
		state.error = null
	})

	it('scales a box from the natural image size to the displayed size', async () => {
		const { container } = render(PaneSubject, { props: { widget: Subject } })
		await chooseImage(container)

		await fireEvent.click(executeButton())

		const image = screen.getByRole('img', { name: 'Chosen image scene.png' })
		if (!(image instanceof HTMLImageElement)) throw new Error('The chosen image is not an img')
		await image.decode()
		const shown = image.getBoundingClientRect()
		const box = screen.getByTestId('detection-box').getBoundingClientRect()
		const scale = shown.width / IMAGE_WIDTH

		expect(scale, 'the image must shrink, or an unscaled box would pass').toBeLessThan(1)
		expect(box.left - shown.left).toBeCloseTo(100 * scale, 0)
		expect(box.top - shown.top).toBeCloseTo(60 * scale, 0)
		expect(box.width).toBeCloseTo(200 * scale, 0)
		expect(box.height).toBeCloseTo(150 * scale, 0)
	})
})
