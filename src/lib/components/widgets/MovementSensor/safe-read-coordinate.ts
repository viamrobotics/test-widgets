export const safeReadCoordinate = (coordinate: number | undefined) => {
	if (Number.isNaN(coordinate)) {
		return undefined
	}

	return coordinate
}
