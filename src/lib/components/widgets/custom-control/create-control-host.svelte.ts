import type { RobotClient } from '@viamrobotics/sdk'

import { createHost, type Host } from '@viamrobotics/post-message-sdk/host'

interface Options {
	getRobot: () => RobotClient | undefined
	getIframe: () => HTMLIFrameElement | undefined
	resourceName: () => string
	onHeight: (px: number) => void
}

interface ControlHost {
	/**
	 * Serves the iframe's guest from the robot once both exist, and does nothing until then.
	 *
	 * @throws If the iframe has no `contentWindow`.
	 */
	start: () => void
	/** Closes the host. Safe to call when none is running. */
	stop: () => void
}

export const createControlHost = ({
	getRobot,
	getIframe,
	resourceName,
	onHeight,
}: Options): ControlHost => {
	let host: Host | undefined

	const stop = () => {
		host?.destroy()
		host = undefined
	}

	const start = () => {
		stop()

		const robot = getRobot()
		const iframe = getIframe()
		if (!robot || !iframe) return

		host = createHost(robot, iframe, {
			// Names the resource in the handshake so the guest's default client targets it.
			resourceName: resourceName(),
			allow: ({ resource }) => resource === resourceName(),
			onSize: (height) => {
				// A non-finite value would reach the iframe's style as invalid CSS, which the browser
				// drops, snapping the frame back to its class height. Bounds live in CSS on the frame.
				if (!Number.isFinite(height)) return
				onHeight(height)
			},
		})
	}

	return { start, stop }
}
