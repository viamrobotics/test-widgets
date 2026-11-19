import { useResourceStatuses } from '@viamrobotics/svelte-sdk'

/** The empty name, which a vision service resolves to its own `default_camera`. */
export const DEFAULT_CAMERA_NAME = ''

/** The camera a vision method reads, as the `Camera` row picks it. */
export interface CameraChoice {
	/** The machine's camera names, in status order. */
	readonly cameras: string[]
	/**
	 * The picked camera. Until the user picks, it is the machine's first camera, or
	 * `DEFAULT_CAMERA_NAME` when the machine lists none.
	 */
	readonly cameraName: string
	pick(cameraName: string): void
}

/** Tracks the `Camera` row's choice for one vision widget. Call it during component init. */
export const createCameraChoice = (partID: () => string): CameraChoice => {
	const statuses = useResourceStatuses(partID, 'camera')

	const cameras = $derived(
		statuses.current
			.map((status) => status.name?.name)
			.filter((name): name is string => name !== undefined)
	)

	let pickedName = $state<string>()
	const cameraName = $derived(pickedName ?? cameras[0] ?? DEFAULT_CAMERA_NAME)

	return {
		get cameras() {
			return cameras
		},
		get cameraName() {
			return cameraName
		},
		pick(next) {
			pickedName = next
		},
	}
}
