import { getContext, setContext, type Snippet } from 'svelte'

const POP_OUT_HOST_KEY = Symbol('pop-out-host')

/** A pop-out window's smallest box in px, the body the content fills, without the host's chrome. */
export interface PopOutSize {
	minWidth: number
	minHeight: number
}

/** What a control asks its host to show in a window of the host's own. */
export interface PopOutRequest {
	/** The window's title, such as `arm-1 › Scene`. */
	title: string
	/** The host never sizes the window body below this. */
	minSize: PopOutSize
	/** What the window renders. It fills the window body edge to edge. */
	content: Snippet
	/**
	 * Called once when the user closes the window from the host's chrome. Not called when the
	 * control closes it through the function `open` returned.
	 */
	onClose: () => void
}

/** Closes the window `open` opened. A second call does nothing. */
export type ClosePopOut = () => void

/**
 * A host app's window manager, such as a floating pane. A control opens its content beside the
 * docked widget instead of inside it. Without a host, the control falls back to a prime-ui Takeover.
 */
export interface PopOutHost {
	open: (request: PopOutRequest) => ClosePopOut
}

/** Makes `host` the window manager for every control below. Call it during component init. */
export const providePopOutHost = (host: PopOutHost): void => {
	setContext(POP_OUT_HOST_KEY, host)
}

/** The nearest `providePopOutHost` ancestor's host, or `undefined` without one. Call it during component init. */
export const usePopOutHost = (): PopOutHost | undefined =>
	getContext<PopOutHost | undefined>(POP_OUT_HOST_KEY)
