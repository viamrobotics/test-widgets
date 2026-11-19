interface PointCloudMapQueryState {
	data: Uint8Array | undefined
	response: Uint8Array
	fetchedWith: unknown[][]
}

export const pointCloudMapQueryState: PointCloudMapQueryState = $state({
	data: undefined,
	response: new Uint8Array(),
	fetchedWith: [],
})

export const resetPointCloudMapQueryState = () => {
	pointCloudMapQueryState.data = undefined
	pointCloudMapQueryState.response = new Uint8Array([1, 2, 3])
	pointCloudMapQueryState.fetchedWith = []
}
