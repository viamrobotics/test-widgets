import type { FloatEntry, LayoutNode } from '@viamrobotics/prime-panes'

import type { PlaygroundPane } from './playground-pane'

const ROOT_FLOAT_ID = 'root-float'

/**
 * The layout under a float node, which may hold no windows yet. prime-panes remounts a node whose
 * id changes, so a root that only turned into a float node when a window opened would remount every
 * docked pane, and with it the control that asked for the window. Returns a root float node as is.
 */
export const withRootFloat = <TData>(
	root: LayoutNode<TData> | undefined
): LayoutNode<TData> | undefined => {
	if (!root || root.type === 'float') return root
	return { type: 'float', id: ROOT_FLOAT_ID, base: root, floats: [] }
}

/**
 * Adds a floating window over the whole layout. Never mutates `root`. A root float node gains the
 * entry on top of its others. Any other root becomes the base of a new float node with id `newFloatId`.
 */
export const addFloatEntry = <TData>(
	root: LayoutNode<TData> | undefined,
	entry: FloatEntry<TData>,
	newFloatId: string
): LayoutNode<TData> => {
	if (root?.type === 'float') return { ...root, floats: [...root.floats, entry] }
	return { type: 'float', id: newFloatId, base: root, floats: [entry] }
}

const isPopOut = (pane: PlaygroundPane) => pane.kind === 'pop-out'

/**
 * Whether a pop-out pane sits anywhere but alone in its own floating window, as after a drop
 * stacked it or split it with another pane. The playground refuses such a layout, since a resource
 * pane's tabs and a pop-out's chrome each render only their own kind of pane.
 */
export const hasLoosePopOut = (node: LayoutNode<PlaygroundPane> | undefined): boolean => {
	if (!node) return false

	switch (node.type) {
		case 'pane': {
			return isPopOut(node.data)
		}
		case 'stack': {
			return node.panes.some((pane) => isPopOut(pane.data))
		}
		case 'split': {
			return hasLoosePopOut(node.first) || hasLoosePopOut(node.second)
		}
		case 'float': {
			return (
				hasLoosePopOut(node.base) ||
				node.floats.some(({ content }) => content.type !== 'pane' && hasLoosePopOut(content))
			)
		}
	}
}
