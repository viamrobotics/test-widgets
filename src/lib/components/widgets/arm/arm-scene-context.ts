import { type Component, getContext, setContext } from 'svelte'

import type { InFlightGuard } from '$lib/components/in-flight-guard.svelte'
import type { PopOutSize } from '$lib/components/pop-out/pop-out-host-context'

const ARM_SCENE_KEY = Symbol('arm-scene')

/** The pop-out's smallest body, from the Arm-Control-Alt board. */
export const ARM_SCENE_POP_OUT_SIZE: PopOutSize = { minWidth: 672, minHeight: 504 }

/** What `ArmControls` passes the scene a host supplies. The scene fills its parent box. */
export interface ArmSceneProps {
	partID: string
	resourceName: string
	/**
	 * Whether the part's motion service is `builtin`. Only then does the scene show the target
	 * gizmo, Preview move, and Execute plan, since `plan` and `execute` are builtin `DoCommand` verbs.
	 */
	isBuiltin: boolean
	/** The pane's conflict group. Execute plan runs through it, so it never overlaps a step, a hold, Zero, or Home. */
	guard: InFlightGuard
	/**
	 * Called with a failure for the pane's error indicator: a plan or execute call, the scene, or a
	 * thrown per-frame task. Called with `undefined` when the failed action is retried.
	 */
	onError: (error: Error | undefined) => void
}

/**
 * Supplies the 3D scene `ArmControls` renders inline from 672 px and in its pop-out. Pass
 * `ArmScene` from `@viamrobotics/test-widgets/arm-scene`. Without it, `ArmControls` shows no scene.
 * Call it during component init.
 */
export const provideArmScene = (scene: Component<ArmSceneProps>): void => {
	setContext(ARM_SCENE_KEY, scene)
}

/** The nearest `provideArmScene` ancestor's scene, or `undefined` without one. Call it during component init. */
export const useArmScene = (): Component<ArmSceneProps> | undefined =>
	getContext<Component<ArmSceneProps> | undefined>(ARM_SCENE_KEY)
