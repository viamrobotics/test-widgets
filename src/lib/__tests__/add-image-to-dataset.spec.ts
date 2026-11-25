import { render } from '@testing-library/svelte'
import { createRawSnippet } from 'svelte'
import { describe, expect, it, vi } from 'vitest'

import type { AddImageToDatasetForm, ImageData } from '../add-image-to-dataset'

import { useAddToDatasetAction } from '../add-image-to-dataset'
import Harness from './__fixtures__/AddImageToDatasetHarness.svelte'

const capture = { binaryData: new Uint8Array([1, 2, 3]), mimeType: 'image/jpeg' }

interface Rendered {
	getAction: ReturnType<typeof useAddToDatasetAction>
	addImageToDataset: (imageData: ImageData) => void
}

const renderHarness = (
	provide: boolean,
	handler?: ((imageData: ImageData) => void) | AddImageToDatasetForm
) => {
	const rendered: Partial<Rendered> = {}
	render(Harness, {
		provide,
		handler,
		onAction: (getAction) => {
			rendered.getAction = getAction
		},
		onLegacy: (addImageToDataset) => {
			rendered.addImageToDataset = addImageToDataset
		},
	})
	const { getAction, addImageToDataset } = rendered
	if (!getAction || !addImageToDataset) {
		throw new Error('harness did not report')
	}
	return { getAction, addImageToDataset }
}

describe('useAddToDatasetAction', () => {
	it('returns undefined when the app provided no context', () => {
		const { getAction } = renderHarness(false)

		expect(getAction()).toBeUndefined()
	})

	it('sends a complete ImageData with the camera name to the legacy onAddImage', async () => {
		const onAddImage = vi.fn<(imageData: ImageData) => void>()
		const { getAction } = renderHarness(true, onAddImage)

		const action = getAction()
		await action?.onConfirm(capture)

		const [sent] = onAddImage.mock.calls[0] ?? []
		expect(action?.form).toBeUndefined()
		expect(action?.resourceName).toBe('cam-1')
		expect(sent).toEqual({
			binaryData: capture.binaryData,
			mimeType: 'image/jpeg',
			partID: 'part-1',
			componentType: 'camera',
			componentName: 'cam-1',
			methodName: 'GetImages',
			dataRequestTimes: [expect.any(Date), expect.any(Date)],
		})
		expect(sent?.dataRequestTimes[0]).toBe(sent?.dataRequestTimes[1])
	})

	it('returns the host form and onConfirm unchanged on the form path', () => {
		const form = createRawSnippet(() => ({ render: () => '<div></div>' }))
		const onConfirm = vi.fn<AddImageToDatasetForm['onConfirm']>()
		const { getAction } = renderHarness(true, { form, onConfirm })

		const action = getAction()

		expect(action?.form).toBe(form)
		expect(action?.onConfirm).toBe(onConfirm)
		expect(action?.resourceName).toBe('cam-1')
		expect(action?.methodName).toBe('GetImages')
	})
})

describe('useAddImageToDataset', () => {
	const imageData: ImageData = {
		binaryData: capture.binaryData,
		partID: 'part-1',
		componentType: 'camera',
		componentName: 'cam-1',
		methodName: 'GetImages',
		mimeType: 'image/jpeg',
		dataRequestTimes: [new Date(0), new Date(0)],
	}

	it('passes the image data to a legacy onAddImage', () => {
		const onAddImage = vi.fn<(imageData: ImageData) => void>()
		const { addImageToDataset } = renderHarness(true, onAddImage)

		addImageToDataset(imageData)

		expect(onAddImage.mock.calls).toEqual([[imageData]])
	})

	it('stays callable with no context provided', () => {
		const { addImageToDataset } = renderHarness(false)

		expect(addImageToDataset(imageData)).toBeUndefined()
	})

	it('does nothing for the form object', () => {
		const form = createRawSnippet(() => ({ render: () => '<div></div>' }))
		const onConfirm = vi.fn<AddImageToDatasetForm['onConfirm']>()
		const { addImageToDataset } = renderHarness(true, { form, onConfirm })

		addImageToDataset(imageData)

		expect(onConfirm.mock.calls).toEqual([])
	})
})
