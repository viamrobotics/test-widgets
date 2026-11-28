/** Props of one named row in a board control's list. */
export interface BoardNameEntryProps {
	partID: string
	resourceName: string
	/** The pin, analog reader, or digital interrupt the row reads. */
	name: string
	onRemove: () => void
	/** Receives the row's status text, an empty string when it has none. */
	onStatusChange: (text: string) => void
}
