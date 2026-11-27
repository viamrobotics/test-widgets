const isConfidence = (value: number): boolean => Number.isFinite(value) && value >= 0 && value <= 1

/**
 * The line that tells the person which detections the service keeps, or `undefined` when no
 * confidence applies. A value outside 0 to 1 is ignored as if absent.
 */
export const describeConfidenceLine = (
	minimumConfidence: number | undefined,
	labelConfidences: Record<string, number> | undefined
): string | undefined => {
	const minimum =
		minimumConfidence !== undefined && isConfidence(minimumConfidence)
			? minimumConfidence
			: undefined
	const parts = Object.entries(labelConfidences ?? {})
		.filter(([, confidence]) => isConfidence(confidence))
		.map(([label, confidence]) => `${label} ${confidence.toString()}`)

	if (parts.length > 0 && minimum !== undefined) parts.push(`others ${minimum.toString()}`)
	if (parts.length === 0 && minimum !== undefined) parts.push(minimum.toString())
	if (parts.length === 0) return undefined

	return `Showing ${parts.join(', ')} and above`
}
