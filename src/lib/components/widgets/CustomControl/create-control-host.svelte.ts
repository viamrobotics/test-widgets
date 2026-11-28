import type { RobotClient } from '@viamrobotics/sdk'

import { createHost, type GuestLayout, type Host } from '@viamrobotics/post-message-sdk/host'

import { boundGuestLayout } from './bound-guest-layout'

interface Options {
	getRobot: () => RobotClient | undefined
	getIframe: () => HTMLIFrameElement | undefined
	resourceName: () => string
	onHeight: (px: number) => void
	/** Receives the guest's stated layout once per connect, already bounded by `boundGuestLayout`. */
	onLayout: (layout: GuestLayout) => void
}

/**
 * A guest's size report. `width` is optional because a guest built on SDK 0.3.0 or older reports
 * no width, and SDK 0.4.1 passes that report on.
 */
interface ReportedSize {
	width?: number
	height: number
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

/**
 * Builds the host's `onSize` handler, which passes the reported height to `onHeight`. The width
 * never gates the height, and a non-finite height is dropped.
 */
export const createSizeHandler =
	(onHeight: (px: number) => void) =>
	({ height }: ReportedSize) => {
		// A non-finite value would reach the iframe's style as invalid CSS, which the browser
		// drops, snapping the frame back to its class height.
		if (!Number.isFinite(height)) return
		onHeight(height)
	}

export const createControlHost = ({
	getRobot,
	getIframe,
	resourceName,
	onHeight,
	onLayout,
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
			onSize: createSizeHandler(onHeight),
			onLayout: (layout) => onLayout(boundGuestLayout(layout)),
		})
	}

	return { start, stop }
}
