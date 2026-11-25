import { render, screen } from '@testing-library/svelte'
import { createRawSnippet } from 'svelte'
import { describe, expect, it } from 'vitest'

import MediaFrame from '../MediaFrame.svelte'

const media = createRawSnippet(() => ({ render: () => '<div data-testid="media"></div>' }))

describe('MediaFrame outside a pip provider', () => {
	it('renders without picture-in-picture when no providePip is above it', () => {
		render(MediaFrame, {
			props: {
				label: 'CaptureAllFromCamera',
				media,
				screenshot: async () => ({ binaryData: new Uint8Array([1]), mimeType: 'image/png' }),
			},
		})

		expect(screen.getByRole('group', { name: 'CaptureAllFromCamera' })).toContainElement(
			screen.getByTestId('media')
		)
		expect(screen.getByRole('button', { name: 'Screenshot' })).toBeInTheDocument()
	})

	it('hides picture-in-picture instead of throwing when the host sets it', () => {
		render(MediaFrame, {
			props: {
				label: 'CaptureAllFromCamera',
				media,
				screenshot: async () => ({ binaryData: new Uint8Array([1]), mimeType: 'image/png' }),
				pictureInPicture: { key: 'vision-1-capture' },
			},
		})

		expect(screen.getByRole('button', { name: 'Screenshot' })).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'Picture-in-picture' })).not.toBeInTheDocument()
	})
})
