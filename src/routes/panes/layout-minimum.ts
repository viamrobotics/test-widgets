import type { LayoutNode } from '@viamrobotics/prime-panes'

/** A size in px. */
export interface PaneSize {
	width: number
	height: number
}

const NO_SIZE: PaneSize = { width: 0, height: 0 }

/**
 * The smallest box a layout subtree fits in without any pane going under its own minimum. Panes
 * side by side add along the split's axis and take the larger size across it. A stack shows one
 * pane at a time, so it needs its largest pane. Floating windows take no room in the box, so a
 * float node needs only its base.
 */
export const layoutMinimum = <TData>(
	node: LayoutNode<TData> | undefined,
	paneMinimum: (data: TData) => PaneSize
): PaneSize => {
	if (!node) return NO_SIZE

	switch (node.type) {
		case 'pane': {
			return paneMinimum(node.data)
		}
		case 'stack': {
			const sizes = node.panes.map((pane) => paneMinimum(pane.data))
			return {
				width: Math.max(0, ...sizes.map(({ width }) => width)),
				height: Math.max(0, ...sizes.map(({ height }) => height)),
			}
		}
		case 'split': {
			const first = layoutMinimum(node.first, paneMinimum)
			const second = layoutMinimum(node.second, paneMinimum)
			return node.direction === 'row'
				? { width: first.width + second.width, height: Math.max(first.height, second.height) }
				: { width: Math.max(first.width, second.width), height: first.height + second.height }
		}
		case 'float': {
			return layoutMinimum(node.base, paneMinimum)
		}
	}
}
