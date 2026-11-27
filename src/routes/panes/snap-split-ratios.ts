import type { FloatEntry, LayoutNode } from '@viamrobotics/prime-panes'

import { layoutMinimum, type PaneSize } from './layout-minimum'

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

/**
 * Moves every split's ratio just far enough that neither side goes under its panes' minimum in a
 * box of `size`. This is the "snap" rung of the below-minimum ladder: prime-panes only keeps a
 * split panel to 2.5rem, so the host enforces the widget minimums itself. A split too small for
 * both sides keeps its ratio, and the pane bodies scroll, the ladder's last rung.
 *
 * Never mutates `node`. Returns the same reference when no ratio moves.
 */
export const snapSplitRatios = <TData>(
	node: LayoutNode<TData>,
	size: PaneSize,
	paneMinimum: (data: TData) => PaneSize
): LayoutNode<TData> => {
	switch (node.type) {
		case 'pane':
		case 'stack': {
			return node
		}
		case 'float': {
			const base = node.base && snapSplitRatios(node.base, size, paneMinimum)
			let hasChanged = base !== node.base
			const floats = node.floats.map((entry): FloatEntry<TData> => {
				const content = snapSplitRatios(entry.content, entry.rect, paneMinimum)
				if (content === entry.content) return entry
				hasChanged = true
				return { ...entry, content }
			})
			return hasChanged ? { ...node, base, floats } : node
		}
		case 'split': {
			const axis = node.direction === 'row' ? 'width' : 'height'
			const total = size[axis]
			const firstMinimum = layoutMinimum(node.first, paneMinimum)[axis]
			const secondMinimum = layoutMinimum(node.second, paneMinimum)[axis]
			const fits = total > 0 && firstMinimum + secondMinimum <= total
			const ratio = fits
				? clamp(node.ratio, firstMinimum / total, 1 - secondMinimum / total)
				: node.ratio

			const firstSize = { ...size, [axis]: total * ratio }
			const secondSize = { ...size, [axis]: total * (1 - ratio) }
			const first = snapSplitRatios(node.first, firstSize, paneMinimum)
			const second = snapSplitRatios(node.second, secondSize, paneMinimum)

			if (ratio === node.ratio && first === node.first && second === node.second) return node
			return { ...node, ratio, first, second }
		}
	}
}

/** Each split's id and ratio, in tree order. Two layouts with the same key size their panes alike. */
export const splitRatiosKey = <TData>(node: LayoutNode<TData> | undefined): string => {
	if (!node) return ''

	switch (node.type) {
		case 'pane':
		case 'stack': {
			return ''
		}
		case 'split': {
			return `${node.id}:${node.ratio}(${splitRatiosKey(node.first)},${splitRatiosKey(node.second)})`
		}
		case 'float': {
			const floats = node.floats.map((entry) => splitRatiosKey(entry.content)).join(',')
			return `${splitRatiosKey(node.base)}[${floats}]`
		}
	}
}
