export interface PoseFieldStatus {
	current: number
	isEdited: boolean
	drift: number | undefined
	isMoving: boolean
	/** The live value when the user last edited this field, or undefined when it is not edited. */
	baseline?: number
}

export interface PoseStatusMessage {
	kind: 'drift' | 'moving'
	label: string
	amount: string
}
