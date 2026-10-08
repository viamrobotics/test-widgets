import { ResourceName, type RobotClient, Struct } from '@viamrobotics/sdk'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createControlHost } from '../create-control-host.svelte'

const RESOURCE = 'my-sensor'
const OTHER_RESOURCE = 'other-resource'

// The handshake written out by hand, since a guest document imports nothing. It records everything
// it receives in document.title, which the same-origin srcdoc iframe lets the spec read, and posts
// whatever the spec tells it to over the port. It never posts `ready`: the spec starts the host only
// after the title shows the listener is installed, so the first `connect` always lands.
const GUEST = `<!doctype html>
<html>
	<body>
		<script type="module">
			const log = []
			const record = (entry) => {
				log.push(entry)
				document.title = JSON.stringify(log)
			}
			let port
			document.title = JSON.stringify(log)
			window.addEventListener('message', (event) => {
				const { data } = event
				if (data?.type === 'connect') {
					port = event.ports[0]
					port.onmessage = (reply) => record({ port: reply.data })
					record({ connect: { ports: event.ports.length } })
				} else if (data?.command === 'send') {
					port.postMessage(data.message)
				}
			})
		</script>
	</body>
</html>`

const sensorService = {
	getReadings: () => ({ readings: Struct.fromJson({ temperature: 21.5 }).fields }),
}

const createFakeRobot = () =>
	// Cast once, at the fixture boundary: the host only calls createServiceClient and
	// resourceNames, and a real RobotClient needs a live connection.
	({
		createServiceClient: () => sensorService,
		resourceNames: () =>
			Promise.resolve(
				[RESOURCE, OTHER_RESOURCE].map(
					(name) =>
						new ResourceName({ namespace: 'rdk', type: 'component', subtype: 'sensor', name })
				)
			),
	}) as unknown as RobotClient

const readingsRequest = (id: string, resource = RESOURCE) => ({
	type: 'request',
	id,
	resource,
	method: 'getReadings',
	args: [],
})

const readLog = (iframe: HTMLIFrameElement): unknown => {
	const title = iframe.contentDocument?.title
	return title ? JSON.parse(title) : []
}

const sendFromGuest = (iframe: HTMLIFrameElement, message: unknown) =>
	iframe.contentWindow?.postMessage({ command: 'send', message }, '*')

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('createControlHost', () => {
	const teardowns: (() => void)[] = []

	afterEach(() => {
		for (const teardown of teardowns.splice(0)) teardown()
	})

	const setup = async ({ withRobot = true } = {}) => {
		const iframe = document.createElement('iframe')
		iframe.srcdoc = GUEST
		document.body.append(iframe)
		await expect.poll(() => iframe.contentDocument?.title).toBe('[]')

		const robot = withRobot ? createFakeRobot() : undefined
		const onHeight = vi.fn()
		const controlHost = createControlHost({
			getRobot: () => robot,
			getIframe: () => iframe,
			resourceName: () => RESOURCE,
			onHeight,
		})
		teardowns.push(controlHost.stop, () => iframe.remove())

		const startAndConnect = async () => {
			controlHost.start()
			await expect.poll(() => readLog(iframe)).toContainEqual({ connect: { ports: 1 } })
		}

		return { iframe, onHeight, controlHost, startAndConnect }
	}

	it('posts connect to the iframe with one MessagePort when started', async () => {
		const { iframe, controlHost } = await setup()

		controlHost.start()

		await expect.poll(() => readLog(iframe)).toEqual([{ connect: { ports: 1 } }])
	})

	it('does nothing without a robot', async () => {
		const { iframe, controlHost } = await setup({ withRobot: false })

		controlHost.start()
		await wait(50)

		expect(readLog(iframe)).toEqual([])
	})

	it('answers the guest with readings and reports its height', async () => {
		const { iframe, onHeight, startAndConnect } = await setup()
		await startAndConnect()

		sendFromGuest(iframe, readingsRequest('1'))
		sendFromGuest(iframe, { type: 'size', height: 300 })

		await expect
			.poll(() => readLog(iframe))
			.toContainEqual({ port: { type: 'response', id: '1', result: { temperature: 21.5 } } })
		await vi.waitFor(() => expect(onHeight).toHaveBeenCalledExactlyOnceWith(300))
	})

	it('rejects a request for another resource as not-allowed', async () => {
		const { iframe, startAndConnect } = await setup()
		await startAndConnect()

		sendFromGuest(iframe, readingsRequest('2', OTHER_RESOURCE))

		await expect
			.poll(() => readLog(iframe))
			.toContainEqual({
				port: { type: 'error', id: '2', error: expect.objectContaining({ kind: 'not-allowed' }) },
			})
	})

	it('passes a reported height through unclamped', async () => {
		const { iframe, onHeight, startAndConnect } = await setup()
		await startAndConnect()

		sendFromGuest(iframe, { type: 'size', height: 5000 })

		await vi.waitFor(() => expect(onHeight).toHaveBeenCalledExactlyOnceWith(5000))
	})

	it('ignores a reported height that is not finite', async () => {
		const { iframe, onHeight, startAndConnect } = await setup()
		await startAndConnect()

		sendFromGuest(iframe, { type: 'size', height: Number.NaN })
		sendFromGuest(iframe, { type: 'size', height: Number.POSITIVE_INFINITY })
		sendFromGuest(iframe, { type: 'size', height: 300 })

		await vi.waitFor(() => expect(onHeight).toHaveBeenCalledExactlyOnceWith(300))
	})

	it('replaces the running host when started again', async () => {
		const { iframe, controlHost, startAndConnect } = await setup()
		await startAndConnect()

		controlHost.start()

		await expect.poll(() => readLog(iframe)).toHaveLength(3)
		expect(readLog(iframe)).toContainEqual({ port: { type: 'disconnect' } })
	})

	it('sends disconnect when stopped and answers nothing afterwards', async () => {
		const { iframe, controlHost, startAndConnect } = await setup()
		await startAndConnect()
		sendFromGuest(iframe, readingsRequest('early'))
		await expect
			.poll(() => readLog(iframe))
			.toContainEqual(expect.objectContaining({ port: expect.objectContaining({ id: 'early' }) }))

		controlHost.stop()
		await expect.poll(() => readLog(iframe)).toContainEqual({ port: { type: 'disconnect' } })
		sendFromGuest(iframe, readingsRequest('late'))
		await wait(50)

		expect(readLog(iframe)).not.toContainEqual(
			expect.objectContaining({ port: expect.objectContaining({ id: 'late' }) })
		)
	})
})
