import type { ValueOf } from 'type-fest'

export const PinModes = {
	READ: 'Read',
	WRITE: 'Write',
} as const

export const PinTypes = {
	GPIO: 'GPIO',
	ANALOG: 'Analog',
} as const

export type PinMode = ValueOf<typeof PinModes>
export type PinType = ValueOf<typeof PinTypes>

export interface PinSelection {
	pin: string
	mode: PinMode
	type: PinType
}

const PIN_MODES: readonly string[] = Object.values(PinModes)
const PIN_TYPES: readonly string[] = Object.values(PinTypes)

export const isPinMode = (value: string): value is PinMode => PIN_MODES.includes(value)

export const isPinType = (value: string): value is PinType => PIN_TYPES.includes(value)

export const PIN_TYPE_ITEMS = Object.values(PinTypes).map((type) => ({ value: type, label: type }))

export const PIN_MODE_ITEMS = Object.values(PinModes).map((mode) => ({ value: mode, label: mode }))
