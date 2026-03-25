import { SlamPosition } from '@viamrobotics/sdk'

export const emptyPosition: SlamPosition = new SlamPosition()

export const position: SlamPosition = new SlamPosition({
	pose: {
		x: 1234,
		y: 2345,
		z: 3456,
		oX: 4,
		oY: 5,
		oZ: 6,
		theta: 7,
	},
})
