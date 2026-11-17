import type { LayoutNode } from '@viamrobotics/prime-panes'

/** Whether a pane with `paneId` sits anywhere in the layout, floating or docked. */
export const hasPane = <TData>(node: LayoutNode<TData> | undefined, paneId: string): boolean => {
	if (!node) return false

	switch (node.type) {
		case 'pane': {
			return node.id === paneId
		}
		case 'stack': {
			return node.panes.some((pane) => pane.id === paneId)
		}
		case 'split': {
			return hasPane(node.first, paneId) || hasPane(node.second, paneId)
		}
		case 'float': {
			return (
				hasPane(node.base, paneId) || node.floats.some((entry) => hasPane(entry.content, paneId))
			)
		}
	}
}

/** The id of the innermost floating window holding the pane, or undefined when it is docked. */
export const floatEntryHolding = <TData>(
	node: LayoutNode<TData> | undefined,
	paneId: string
): string | undefined => {
	if (!node) return undefined

	switch (node.type) {
		case 'pane':
		case 'stack': {
			return undefined
		}
		case 'split': {
			return floatEntryHolding(node.first, paneId) ?? floatEntryHolding(node.second, paneId)
		}
		case 'float': {
			for (const entry of node.floats) {
				if (hasPane(entry.content, paneId))
					return floatEntryHolding(entry.content, paneId) ?? entry.id
			}
			return floatEntryHolding(node.base, paneId)
		}
	}
}
