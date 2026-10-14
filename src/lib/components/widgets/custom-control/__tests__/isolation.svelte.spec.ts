import { render } from '@testing-library/svelte'
import { ResourceName, type RobotClient, type Struct } from '@viamrobotics/sdk'
import { useRobotClient } from '@viamrobotics/svelte-sdk'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { prepareArtifact } from '../custom-control'
import Subject from '../custom-control.svelte'

vi.mock('@viamrobotics/svelte-sdk', () => ({ useRobotClient: vi.fn() }))

const RESOURCE = 'my-sensor'
const UNREACHABLE = 'http://localhost:1/'

interface Report {
	fetch: string
	image: string
	location: string
	violations: string[]
}

type FrameMessage = { frame: string } & ({ type: 'report'; report: Report } | { type: 'unloaded' })

// What a hostile guest would try, in the order a control would: a fetch, an image, a form submit.
// Port 1 refuses connections, so the network itself rejects every attempt whether or not the policy
// is present. That makes the outcomes alone unable to tell a blocked attempt from a failed one, so
// the guest also records each `securitypolicyviolation` event, which only a policy produces, and
// where it is still living once the attempts settle (a navigation would have unloaded it).
const probeGuest = (sendDefinition: string) => `<!doctype html>
<html>
	<body>
		<form id="form" action="${UNREACHABLE}" method="post"></form>
		<script>
			const violations = []
			document.addEventListener('securitypolicyviolation', (event) => {
				violations.push(event.effectiveDirective)
			})
			${sendDefinition}

			const fetched = fetch('${UNREACHABLE}').then(
				() => 'allowed',
				(error) => error.name
			)
			const imaged = new Promise((resolve) => {
				const image = new Image()
				image.onload = () => resolve('loaded')
				image.onerror = () => resolve('error')
				image.src = '${UNREACHABLE}x'
			})
			document.getElementById('form').requestSubmit()
			const settled = new Promise((resolve) => setTimeout(resolve, 300))

			Promise.all([fetched, imaged, settled]).then(([fetch, image]) => {
				send({ fetch, image, location: location.href, violations })
			})
		</script>
	</body>
</html>`

// The widget's frame has no same-origin access, so the guest reports the way a real control talks to
// the host: a request over the bridge whose args carry the report.
const BRIDGE_SEND = `
			let port
			window.addEventListener('message', (event) => {
				if (event.data?.type === 'connect') port = event.ports[0]
			})
			parent.postMessage({ protocol: 'viam-post-message', version: 1, type: 'ready' }, '*')
			const send = async (report) => {
				while (!port) await new Promise((resolve) => setTimeout(resolve, 10))
				port.postMessage({
					type: 'request',
					id: 'report',
					resource: '${RESOURCE}',
					method: 'getReadings',
					args: [report],
				})
			}`

// A bare frame has no bridge, so it reports to its parent, and says so when it unloads. Messages
// carry a frame id because a document that is unloading is no longer the iframe's `contentWindow`.
const messageSend = (frame: string) => `
			window.addEventListener('pagehide', () => {
				parent.postMessage({ frame: '${frame}', type: 'unloaded' }, '*')
			})
			const send = (report) => parent.postMessage({ frame: '${frame}', type: 'report', report }, '*')`

const createFakeRobot = (reports: unknown[]) =>
	// Cast once, at the fixture boundary: the host only calls createServiceClient and resourceNames.
	({
		createServiceClient: () => ({
			// The host builds a real SensorClient, which wraps the guest's argument as `extra`.
			getReadings: ({ extra }: { extra?: Struct }) => {
				reports.push(extra?.toJson())
				return { readings: {} }
			},
		}),
		resourceNames: () =>
			Promise.resolve([
				new ResourceName({
					namespace: 'rdk',
					type: 'component',
					subtype: 'sensor',
					name: RESOURCE,
				}),
			]),
	}) as unknown as RobotClient

describe('custom control isolation', () => {
	const teardowns: (() => void)[] = []

	afterEach(() => {
		for (const teardown of teardowns.splice(0)) teardown()
	})

	const mountBareFrame = (
		guest: (sendDefinition: string) => string,
		sandbox: string,
		frame: string
	) => {
		const messages: FrameMessage[] = []
		const iframe = document.createElement('iframe')
		const onMessage = (event: MessageEvent<FrameMessage>) => {
			if (event.data.frame === frame) messages.push(event.data)
		}
		window.addEventListener('message', onMessage)
		teardowns.push(() => {
			window.removeEventListener('message', onMessage)
			iframe.remove()
		})
		iframe.setAttribute('sandbox', sandbox)
		iframe.srcdoc = guest(messageSend(frame))
		document.body.append(iframe)
		return messages
	}

	const reportsIn = (messages: FrameMessage[]) =>
		messages.flatMap((message) => (message.type === 'report' ? [message.report] : []))

	describe('in the widget', () => {
		const reports: unknown[] = []

		beforeEach(() => {
			reports.length = 0
			vi.mocked(useRobotClient).mockReturnValue({
				current: createFakeRobot(reports),
			} as unknown as ReturnType<typeof useRobotClient>)
		})

		// Without the policy the fetch and image would still fail on the refused connection, so only
		// the violation events change: they would be missing, and `violations` would read `[]`. The
		// widget's sandbox has no `allow-forms`, so the submit never reaches the policy at all; the
		// bare-frame specs below prove `form-action` where the sandbox does not get there first.
		it('blocks fetch and image loads and keeps the frame where it was', async () => {
			render(Subject, {
				partID: 'part-id',
				resourceName: RESOURCE,
				html: probeGuest(BRIDGE_SEND),
			})

			await expect.poll(() => reports, { timeout: 5000 }).toHaveLength(1)

			expect(reports[0]).toEqual({
				fetch: 'TypeError',
				image: 'error',
				location: 'about:srcdoc',
				violations: expect.arrayContaining(['connect-src', 'img-src']),
			})
		})
	})

	describe('in a frame that allows forms, so only the policy stands in the way', () => {
		// With the policy missing, `violations` reads `[]` and the submit navigates the frame away
		// (see the unprepared frame below), so `location` would never be reported at all.
		it('blocks fetch, image loads, and form submission', async () => {
			const messages = mountBareFrame(
				(send) => prepareArtifact(probeGuest(send)),
				'allow-scripts allow-forms',
				'prepared'
			)

			await expect.poll(() => reportsIn(messages), { timeout: 5000 }).toHaveLength(1)

			expect(reportsIn(messages)[0]).toEqual({
				fetch: 'TypeError',
				image: 'error',
				location: 'about:srcdoc',
				violations: expect.arrayContaining(['connect-src', 'img-src', 'form-action']),
			})
			expect(messages.map(({ type }) => type)).not.toContain('unloaded')
		})

		// The control: the same guest and sandbox without the policy. It is what the check above
		// would read if prepareArtifact injected nothing.
		it('lets the same guest navigate away when the policy is missing', async () => {
			const messages = mountBareFrame(probeGuest, 'allow-scripts allow-forms', 'unprepared')

			await expect
				.poll(() => messages.map(({ type }) => type), { timeout: 5000 })
				.toContain('unloaded')

			expect(reportsIn(messages).flatMap((report) => report.violations)).toEqual([])
		})
	})
})
