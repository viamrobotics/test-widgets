export type OrientationFormat = 'vector' | 'euler'
export type AngleUnit = 'deg' | 'rad'

export const FORMAT_LABELS = { vector: 'Vector', euler: 'Euler' } as const
export const UNIT_LABELS = { deg: 'Degrees', rad: 'Radians' } as const
export const FORMATS: OrientationFormat[] = ['vector', 'euler']
export const UNITS: AngleUnit[] = ['deg', 'rad']
