import { fireEvent, render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { Classification } from '@viamrobotics/sdk'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import Subject from '../get-classifications-widget.svelte'
import {
	chooseFile,
	createImageFile,
	IMAGE_HEIGHT,
	IMAGE_WIDTH,
} from './__fixtures__/choose-image-file'

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

const executeButton = () => screen.getByRole('button', { name: 'Execute' })

const chooseImage = async (container: HTMLElement) => {
	const file = await createImageFile('cat.png')
	await chooseFile(container, file)
	await screen.findByText('cat.png')
	return file
}

const typeCount = async (text: string) => {
	const field = screen.getByRole('spinbutton', { name: 'Count' })
	await userEvent.clear(field)
	await userEvent.type(field, text)
}

describe('GetClassifications widget', () => {
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

	it('holds Execute back until an image is chosen', () => {
		render(Subject, { props: PROPS })

		expect(screen.getByText('No image chosen')).toBeInTheDocument()
		expect(executeButton()).toBeDisabled()
	})

	it('sends nothing when an image is chosen, only on Execute', async () => {
		const { container } = render(Subject, { props: PROPS })

		await chooseImage(container)

		expect(executeButton()).toBeEnabled()
		expect(state.mutate).not.toHaveBeenCalled()
	})

	it("sends the file's bytes, natural size, mime type, and a Count of 3 to start", async () => {
		const { container } = render(Subject, { props: PROPS })
		const file = await chooseImage(container)

		await fireEvent.click(executeButton())

		const bytes = new Uint8Array(await file.arrayBuffer())
		expect(screen.getByRole('spinbutton', { name: 'Count' })).toHaveValue(3)
		expect(state.mutate).toHaveBeenCalledTimes(1)
		expect(state.mutate.mock.calls[0]?.[0]).toEqual([
			bytes,
			IMAGE_WIDTH,
			IMAGE_HEIGHT,
			'image/png',
			3,
		])
	})

	it('sends the Count as n', async () => {
		const { container } = render(Subject, { props: PROPS })
		await chooseImage(container)

		await typeCount('7')
		await fireEvent.click(executeButton())

		expect(state.mutate.mock.calls[0]?.[0]).toMatchObject({ 4: 7 })
	})

	it('holds Execute back while the Count is not a whole number of at least one', async () => {
		const { container } = render(Subject, { props: PROPS })
		await chooseImage(container)

		await typeCount('0')

		expect(executeButton()).toBeDisabled()
	})

	it('draws the chosen image and a row for each classification in the response', async () => {
		state.response = [new Classification({ className: 'tabby cat', confidence: 0.912 })]
		const { container } = render(Subject, { props: PROPS })
		await chooseImage(container)

		await fireEvent.click(executeButton())

		expect(screen.getByRole('img', { name: 'Chosen image cat.png' })).toBeInTheDocument()
		expect(
			within(screen.getByRole('list', { name: 'Classifications' })).getByRole('listitem')
		).toHaveTextContent('tabby cat 91.20 %')
	})

	it('reads - before Execute', () => {
		render(Subject, { props: PROPS })

		expect(screen.getByRole('group', { name: 'Classifications' })).toHaveTextContent(
			'Classifications -'
		)
	})

	it("shows the GetClassifications error in the section's error indicator", async () => {
		state.error = new Error('model failed to load')

		render(Subject, { props: PROPS })
		await fireEvent.focus(screen.getByRole('button', { name: '1 error, copy to clipboard' }))

		expect(screen.getByText(/model failed to load/iu)).toBeInTheDocument()
	})
})
