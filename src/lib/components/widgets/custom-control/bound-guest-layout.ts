import type { GuestLayout } from '@viamrobotics/post-message-sdk/host'

// A wider stated minWidth is capped, so every custom control still fits a 320 px pane.
const MAX_STATED_MIN_WIDTH = 320

/**
 * Bounds a guest's stated layout before the host acts on it. `minWidth` is capped at
 * `MAX_STATED_MIN_WIDTH`, and each ideal is raised to at least its bounded minimum. `minHeight` is
 * not capped. A field the guest left out stays out.
 */
export const boundGuestLayout = (layout: GuestLayout): GuestLayout => {
	const bounded: GuestLayout = {}
	if (layout.minWidth !== undefined) {
		bounded.minWidth = Math.min(layout.minWidth, MAX_STATED_MIN_WIDTH)
	}
	if (layout.minHeight !== undefined) {
		bounded.minHeight = layout.minHeight
	}
	if (layout.idealWidth !== undefined) {
		bounded.idealWidth = Math.max(layout.idealWidth, bounded.minWidth ?? 0)
	}
	if (layout.idealHeight !== undefined) {
		bounded.idealHeight = Math.max(layout.idealHeight, bounded.minHeight ?? 0)
	}
	return bounded
}
