import type { ValueOf } from 'type-fest';

export const PinModes = {
	READ: 'Read',
	WRITE: 'Write'
} as const;

export const PinTypes = {
	GPIO: 'GPIO',
	ANALOG: 'Analog'
} as const;

export type PinMode = ValueOf<typeof PinModes>;
export type PinType = ValueOf<typeof PinTypes>;

export interface PinSelection {
	pin: string;
	mode: PinMode;
	type: PinType;
}
