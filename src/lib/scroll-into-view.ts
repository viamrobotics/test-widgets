import type { Action } from 'svelte/action';

export const scrollIntoView: Action<HTMLElement, ScrollIntoViewOptions | undefined> = (
	node: HTMLElement,
	scrollIntoViewOptions?: ScrollIntoViewOptions
) => {
	let id: number | undefined = undefined;
	if (window.location.hash === `#${node.id}`) {
		/**
		 * Set timeout enqueues the scroll action behind all other queued events.
		 * This allows us to wait for other animation transitions to complete before scrolling into view.
		 */
		id = window.setTimeout(() => {
			node.scrollIntoView(scrollIntoViewOptions);
		}, 0);
	}

	return {
		destroy() {
			clearTimeout(id);
		}
	};
};
