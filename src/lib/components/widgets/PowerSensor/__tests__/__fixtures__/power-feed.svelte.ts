interface PowerFeed {
	updatedAt: number
	voltage: number
	current: number
	power: number
	error: Error | null
}

export const powerFeed: PowerFeed = $state({
	updatedAt: 0,
	voltage: 12,
	current: 1,
	power: 12,
	error: null,
})

export const publishReading = (voltage: number) => {
	powerFeed.voltage = voltage
	powerFeed.current = voltage / 10
	powerFeed.power = voltage * 2
	powerFeed.error = null
	powerFeed.updatedAt += 1
}

export const resetFeed = (voltage: number) => {
	powerFeed.updatedAt = 0
	powerFeed.error = null
	publishReading(voltage)
}
