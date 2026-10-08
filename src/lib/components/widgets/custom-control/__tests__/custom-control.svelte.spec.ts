import { render, screen, within } from '@testing-library/svelte'
import { createHost } from '@viamrobotics/post-message-sdk/host'
import { createRawSnippet } from 'svelte'
import { describe, expect, it, vi } from 'vitest'

import { CUSTOM_CONTROL_CSP } from '../../../../custom-control/content-security-policy.ts'
import { prepareArtifact } from '../../../../custom-control/prepare-artifact.ts'
import Subject from '../custom-control.svelte'
import WithSibling from './__fixtures__/with-sibling.svelte'

// The widget reads the robot through useRobotClient, so the spec stubs that hook the way the other
// widget specs do, and runs the real host against it. Guests here never make a request.
vi.mock('@viamrobotics/svelte-sdk', () => ({
	useRobotClient: vi.fn(() => ({ current: {} })),
}))

vi.mock('@viamrobotics/post-message-sdk/host', async (importOriginal) => {
	const original = await importOriginal<typeof import('@viamrobotics/post-message-sdk/host')>()
	return { ...original, createHost: vi.fn(original.createHost) }
})

const IDLE_GUEST = '<p>Waiting</p>'

const guestReportingHeight = (height: number) => `<script type="module">
	window.addEventListener('message', (event) => {
		if (event.data?.type === 'connect') {
			event.ports[0].postMessage({ type: 'size', height: ${height} })
		}
	})
	parent.postMessage({ protocol: 'viam-post-message', version: 1, type: 'ready' }, '*')
</script>`

const renderSubject = (props: Partial<Parameters<typeof render<typeof Subject>>[1]> = {}) =>
	render(Subject, { partID: 'part-id', resourceName: 'my-sensor', html: IDLE_GUEST, ...props })

const getFrame = () => screen.getByTitle(/custom control for my-sensor/iu)

describe('CustomControl', () => {
	it('sandboxes the iframe with allow-scripts and nothing else', () => {
		renderSubject()

		expect(getFrame().getAttribute('sandbox')).toBe('allow-scripts')
	})

	it('loads the prepared artifact as the iframe srcdoc', () => {
		renderSubject({ html: '<p>Hello control</p>' })

		const srcdoc = getFrame().getAttribute('srcdoc')

		expect(srcdoc).toBe(prepareArtifact('<p>Hello control</p>'))
		expect(srcdoc).toContain(CUSTOM_CONTROL_CSP)
	})

	it('sizes the frame by class until the guest reports a height', () => {
		renderSubject()

		expect(getFrame()).toHaveClass('h-40')
		expect(getFrame().style.height).toBe('')
	})

	it('shows progress until the guest reports a size, then sizes the iframe to it', async () => {
		renderSubject({ html: guestReportingHeight(300) })

		expect(screen.getByRole('progressbar')).toBeInTheDocument()
		await expect.poll(() => getComputedStyle(getFrame()).height).toBe('300px')
		expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
	})

	// The harness loads no stylesheet, so the 80vh cap itself is Tailwind's rule to honor; the
	// component's contract is the requested height on the element plus the capping class.
	it('sets a large reported height inline and leaves the 80vh cap to the class', async () => {
		renderSubject({ html: guestReportingHeight(5000) })

		await expect.poll(() => getFrame().style.height).toBe('5000px')
		expect(getFrame()).toHaveClass('max-h-[80vh]')
		expect(getFrame()).toHaveClass('min-h-px')
	})

	it('renders the loading snippet in place of the default progress', () => {
		const loading = createRawSnippet(() => ({ render: () => '<p>Preparing control</p>' }))

		renderSubject({ loading })

		expect(screen.getByText('Preparing control')).toBeInTheDocument()
		expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
	})

	it('starts over with the new artifact when the html changes', async () => {
		const { rerender } = renderSubject({ html: guestReportingHeight(300) })
		await expect.poll(() => getComputedStyle(getFrame()).height).toBe('300px')

		await rerender({ html: IDLE_GUEST })

		expect(getFrame().style.height).toBe('')
		expect(screen.getByRole('progressbar')).toBeInTheDocument()
	})

	describe('when the host cannot start', () => {
		const failToStart = () =>
			vi.mocked(createHost).mockImplementation(() => {
				throw new Error('no contentWindow')
			})

		it('renders the error snippet', () => {
			failToStart()
			const error = createRawSnippet<[{ failure: Error; reset: () => void }]>((props) => ({
				render: () => `<p>Custom failure: ${props().failure.message}</p>`,
			}))

			renderSubject({ error })

			expect(screen.getByRole('alert')).toHaveTextContent('Custom failure: no contentWindow')
			expect(screen.queryByTitle(/custom control for my-sensor/iu)).not.toBeInTheDocument()
		})

		it('renders the control again when the error snippet calls reset', async () => {
			vi.mocked(createHost).mockImplementationOnce(() => {
				throw new Error('no contentWindow')
			})
			const error = createRawSnippet<[{ failure: Error; reset: () => void }]>((props) => ({
				render: () => '<button>Try again</button>',
				setup: (button) => {
					button.addEventListener('click', props().reset)
				},
			}))
			renderSubject({ error })

			screen.getByRole('button', { name: 'Try again' }).click()

			await expect
				.poll(() => screen.queryByTitle(/custom control for my-sensor/iu))
				.toBeInTheDocument()
			expect(screen.queryByRole('alert')).not.toBeInTheDocument()
		})

		it('leaves the rest of the page rendered', () => {
			failToStart()

			render(WithSibling, { partID: 'part-id', resourceName: 'my-sensor', html: IDLE_GUEST })

			expect(screen.getByRole('alert')).toBeInTheDocument()
			expect(screen.getByTestId('sibling')).toBeInTheDocument()
		})

		it('falls back to the repo error display', () => {
			failToStart()

			renderSubject()

			expect(
				within(screen.getByRole('alert')).getByText(/Error: no contentWindow/u)
			).toBeInTheDocument()
		})
	})
})
