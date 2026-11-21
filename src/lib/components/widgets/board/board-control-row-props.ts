/** Reports one row's text for the `BoardControls` status line. An empty string clears it. */
export type BoardStatusReporter = (text: string) => void

/** Props every listed row in `BoardControls` takes: one pin, analog reader, or digital interrupt. */
export interface BoardNamedRowProps {
	partID: string
	resourceName: string
	/** The pin, analog reader, or digital interrupt name as the person typed it. */
	name: string
	/** Drops the row from the pane. Sends nothing. */
	onRemove: () => void
	/** Such as "Sending 11 high." while a write is in flight, or "a9 is not polling" after a failed read. */
	onStatusChange: BoardStatusReporter
}

/** Props of the power mode row in `BoardControls`. */
export interface BoardPowerModeRowProps {
	partID: string
	resourceName: string
	/** Such as "Confirm to send Offline deep for 30 s" while armed. */
	onStatusChange: BoardStatusReporter
}
