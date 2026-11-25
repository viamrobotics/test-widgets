import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CANVAS_FITS, MEDIA_FITS, type MediaFit } from '../media-fit'
import { createMediaFit, type MediaFitOptions, type MediaFitState } from '../media-fit.svelte'
import Host from './__fixtures__/MediaFrameHost.svelte'

vi.mock('#lib/pip/context.svelte.js', () => ({
	providePip: () => ({}),
	usePip: () => ({}),
	hasPip: () => false,
}))

const disposers: (() => void)[] = []

const createFit = (key: string, options: MediaFitOptions): MediaFitState => {
	let state: MediaFitState | undefined
	disposers.push(
		$effect.root(() => {
			state = createMediaFit(() => key, options)
		})
	)
	if (!state) throw new Error('createMediaFit returned nothing')
	return state
}

const storedFit = (key: string) => localStorage.getItem(key)

beforeEach(() => {
	localStorage.clear()
})

afterEach(() => {
	for (const dispose of disposers.splice(0)) dispose()
})

describe('createMediaFit', () => {
	it('keeps a separate saved fit for each key', () => {
		const cameraOne = createFit('media-fit/camera-1', { fits: MEDIA_FITS })
		const cameraTwo = createFit('media-fit/camera-2', { fits: MEDIA_FITS })

		cameraOne.current = 'stretch'
		cameraTwo.current = 'crop'

		expect(cameraOne.current).toBe('stretch')
		expect(cameraTwo.current).toBe('crop')
		expect(createFit('media-fit/camera-1', { fits: MEDIA_FITS }).current).toBe('stretch')
		expect(createFit('media-fit/camera-2', { fits: MEDIA_FITS }).current).toBe('crop')
	})

	it('reads Keep ratio with nothing stored and no default', () => {
		expect(createFit('media-fit/camera-1', { fits: MEDIA_FITS }).current).toBe('keep-ratio')
	})

	it('reads defaultFit while nothing is stored', () => {
		const state = createFit('media-fit/camera-1', { fits: MEDIA_FITS, defaultFit: 'fit' })

		expect(state.current).toBe('fit')
	})

	it('leaves an empty key out of storage when it is read', () => {
		const state = createFit('media-fit/camera-1', { fits: MEDIA_FITS, defaultFit: 'fit' })

		void state.current

		expect(storedFit('media-fit/camera-1')).toBeNull()
	})

	it('applies a defaultFit given after the key was read without one', () => {
		void createFit('media-fit/camera-1', { fits: MEDIA_FITS }).current

		const state = createFit('media-fit/camera-1', { fits: MEDIA_FITS, defaultFit: 'fit' })

		expect(state.current).toBe('fit')
	})

	it('keeps the pick when a later host gives a different defaultFit', () => {
		createFit('media-fit/camera-1', { fits: MEDIA_FITS, defaultFit: 'fit' }).current = 'stretch'

		const state = createFit('media-fit/camera-1', { fits: MEDIA_FITS, defaultFit: 'crop' })

		expect(state.current).toBe('stretch')
	})

	it('never overwrites a stored fit with defaultFit', () => {
		localStorage.setItem('media-fit/camera-1', JSON.stringify('crop'))

		const state = createFit('media-fit/camera-1', { fits: MEDIA_FITS, defaultFit: 'fit' })

		expect(state.current).toBe('crop')
		expect(storedFit('media-fit/camera-1')).toBe(JSON.stringify('crop'))
	})

	it('reads a stored fit outside fits as Keep ratio and leaves the store alone', () => {
		localStorage.setItem('media-fit/map', JSON.stringify('stretch'))

		const state = createFit('media-fit/map', { fits: CANVAS_FITS })

		expect(state.current).toBe('keep-ratio')
		expect(storedFit('media-fit/map')).toBe(JSON.stringify('stretch'))
	})

	it('reads a default outside fits as Keep ratio', () => {
		const state = createFit('media-fit/map', { fits: CANVAS_FITS, defaultFit: 'crop' })

		expect(state.current).toBe('keep-ratio')
	})

	it('reads an unknown stored value as Keep ratio', () => {
		localStorage.setItem('media-fit/camera-1', JSON.stringify('zoom'))

		expect(createFit('media-fit/camera-1', { fits: MEDIA_FITS }).current).toBe('keep-ratio')
	})
})

const fixedFit = (current: MediaFit, fits: readonly MediaFit[] = MEDIA_FITS): MediaFitState => ({
	current,
	fits,
})

interface FillCase {
	current: MediaFit
	objectFit: string
}

const FILL_CASES: FillCase[] = [
	{ current: 'fit', objectFit: 'contain' },
	{ current: 'stretch', objectFit: 'fill' },
	{ current: 'crop', objectFit: 'cover' },
]

const optionNames = async () => {
	const options = await screen.findAllByRole('option')
	return options.map((option) => option.textContent?.trim())
}

describe('MediaFrame Fit select', () => {
	it('has no Fit select without fit', () => {
		render(Host, { props: { withChildren: true } })

		expect(screen.queryByRole('combobox', { name: 'Fit' })).not.toBeInTheDocument()
	})

	it('lists all four fits for media', async () => {
		const user = userEvent.setup()
		render(Host, { props: { fit: fixedFit('keep-ratio') } })

		await user.click(screen.getByRole('combobox', { name: 'Fit' }))

		expect(await optionNames()).toEqual(['Keep ratio', 'Fit', 'Stretch', 'Crop to fill'])
	})

	it('lists only Keep ratio and Fit for a canvas', async () => {
		const user = userEvent.setup()
		render(Host, { props: { fit: fixedFit('keep-ratio', CANVAS_FITS) } })

		await user.click(screen.getByRole('combobox', { name: 'Fit' }))

		expect(await optionNames()).toEqual(['Keep ratio', 'Fit'])
	})

	it('draws the Fit select as the last row, after the host controls', () => {
		render(Host, { props: { withChildren: true, fit: fixedFit('keep-ratio') } })

		const controls = screen.getByTestId('host-controls').parentElement
		const lastRow = controls?.lastElementChild
		if (!(lastRow instanceof HTMLElement)) throw new Error('The frame drew no control rows')

		expect(within(lastRow).getByRole('combobox', { name: 'Fit' })).toBeInTheDocument()
	})

	it('saves the picked fit under the host key', async () => {
		const user = userEvent.setup()
		const state = createFit('media-fit/camera-1', { fits: MEDIA_FITS })
		render(Host, { props: { fit: state } })

		await user.click(screen.getByRole('combobox', { name: 'Fit' }))
		await user.click(await screen.findByRole('option', { name: 'Crop to fill' }))

		expect(state.current).toBe('crop')
		expect(storedFit('media-fit/camera-1')).toBe(JSON.stringify('crop'))
	})

	it('keeps the aspect ratio box at Keep ratio', () => {
		render(Host, { props: { aspectRatio: '4 / 3', fit: fixedFit('keep-ratio') } })

		const mediaBox = screen.getByTestId('media').parentElement
		expect(mediaBox?.style.aspectRatio).toBe('4 / 3')
		expect(mediaBox).not.toHaveClass('flex-1')
	})

	it.each(FILL_CASES)(
		'fills the pane height at $current with object-fit $objectFit on the media',
		({ current, objectFit }) => {
			render(Host, {
				props: { aspectRatio: '4 / 3', paneClass: 'h-[300px] w-[820px]', fit: fixedFit(current) },
			})

			const mediaBox = screen.getByTestId('media').parentElement
			const frame = screen.getByRole('group', { name: 'GetImages' })
			expect(mediaBox?.style.aspectRatio).toBe('')
			expect(frame.getBoundingClientRect().height).toBe(300)
			expect(getComputedStyle(screen.getByTestId('media')).objectFit).toBe(objectFit)
		}
	)
})
