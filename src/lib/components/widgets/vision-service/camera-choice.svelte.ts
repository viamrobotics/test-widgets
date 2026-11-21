import { useResourceStatuses } from '@viamrobotics/svelte-sdk'

/** The empty name, which a vision service resolves to its own `default_camera`. */
export const DEFAULT_CAMERA_NAME = ''

/** The camera a vision method reads, as the `Camera` row picks it. */
export interface CameraChoice {
	/** The machine's camera names, in status order. */
	readonly cameras: string[]
	/**
	 * The picked camera. Until the user picks, it is the service's default camera when that
	 * names one of the machine's cameras, else the machine's first camera, or
	 * `DEFAULT_CAMERA_NAME` when the machine lists none.
	 */
	readonly cameraName: string
	pick(cameraName: string): void
}

/**
 * Tracks the `Camera` row's choice for one vision widget. Call it during component init.
 *
 * @param partID Reads the part whose cameras are listed.
 * @param defaultCameraName Reads the service's `defaultCamera`. An empty or unknown name is ignored.
 */
export const createCameraChoice = (
	partID: () => string,
	defaultCameraName: () => string | undefined = () => undefined
): CameraChoice => {
	const statuses = useResourceStatuses(partID, 'camera')

	const cameras = $derived(
		statuses.current
			.map((status) => status.name?.name)
			.filter((name): name is string => name !== undefined)
	)

	let pickedName = $state<string>()
	const preselectedName = $derived.by(() => {
		const defaultName = defaultCameraName()
		if (defaultName && cameras.includes(defaultName)) return defaultName
		return cameras[0] ?? DEFAULT_CAMERA_NAME
	})
	const cameraName = $derived(pickedName ?? preselectedName)

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
