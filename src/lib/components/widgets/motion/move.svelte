<script
	lang="ts"
	module
>
	import type { Pose } from '@viamrobotics/sdk'

	type PoseKey = keyof Pose

	const POSE_KEYS: PoseKey[] = ['x', 'y', 'z', 'oX', 'oY', 'oZ', 'theta']

	// Tight enough to catch a real move, loose enough to ignore encoder noise. Theta is in degrees.
	const DRIFT_THRESHOLDS: Record<PoseKey, number> = {
		x: 1,
		y: 1,
		z: 1,
		oX: 0.01,
		oY: 0.01,
		oZ: 0.01,
		theta: 0.5,
	}

	const ZERO_POSE: Pose = { x: 0, y: 0, z: 0, oX: 0, oY: 0, oZ: 1, theta: 0 }

	const parseErrorOf = (parse: (json: string) => unknown, json: string): string | undefined => {
		try {
			parse(json)
			return undefined
		} catch (error) {
			return error instanceof Error ? error.message : String(error)
		}
	}
</script>

<script lang="ts">
	import { mdiInformationOutline, mdiPlayCircleOutline } from '@mdi/js'
	import { Icon, Progress, Tooltip } from '@viamrobotics/prime-ui'
	import { PersistedState } from 'runed'

	import type { PoseFieldStatus } from '$lib/components/pose-editor.svelte'

	import PoseEditor from '$lib/components/pose-editor.svelte'
	import { useEditedTargets } from '$lib/components/widgets/arm/use-edited-targets.svelte'

	import JsonArgumentFolder from './json-argument-folder.svelte'
	import { type MoveInput, parseConstraints, parseWorldState } from './parse-move-args'

	interface Props {
		/** The frame being moved. Gates execution and re-seeds the editor on change. */
		frameName: string
		/** The reference frame the destination pose is expressed in. */
		destination: string
		currentPose?: Pose
		isPending: boolean
		storageKey: string
		onExecute: (input: MoveInput) => void
	}

	const { frameName, destination, currentPose, isPending, storageKey, onExecute }: Props = $props()

	const livePose = $derived(currentPose ?? ZERO_POSE)

	// One set of edits per frame and destination, so choosing either starts from the live pose again.
	const editSession = $derived({
		key: JSON.stringify([frameName, destination]),
		targets: useEditedTargets<PoseKey>(
			(key) => livePose[key],
			(key) => DRIFT_THRESHOLDS[key]
		),
	})
	const targets = $derived(editSession.targets)

	const pose = $derived<Pose>({
		x: targets.target('x'),
		y: targets.target('y'),
		z: targets.target('z'),
		oX: targets.target('oX'),
		oY: targets.target('oY'),
		oZ: targets.target('oZ'),
		theta: targets.target('theta'),
	})

	const handlePoseChange = (next: Pose) => {
		for (const key of POSE_KEYS) {
			if (next[key] !== pose[key]) {
				targets.edit(key, next[key])
			}
		}
	}

	const resetToZero = () => {
		for (const key of POSE_KEYS) {
			targets.edit(key, ZERO_POSE[key])
		}
	}

	// Restore buttons and drift need a live pose to compare against, so they wait for the first read.
	const fieldStatus = $derived(
		currentPose === undefined
			? undefined
			: (key: PoseKey): PoseFieldStatus => ({
					current: currentPose[key],
					isEdited: targets.isEdited(key),
					drift: targets.drift(key),
					isMoving: false,
				})
	)

	const worldState = $derived(new PersistedState(`${storageKey}/world-state`, ''))
	const constraints = $derived(new PersistedState(`${storageKey}/constraints`, ''))

	const worldStateError = $derived(parseErrorOf(parseWorldState, worldState.current))
	const constraintsError = $derived(parseErrorOf(parseConstraints, constraints.current))

	const disabled = $derived(frameName === '' || isPending)

	const quickSetId = $props.id()

	const execute = () => {
		onExecute({
			referenceFrame: destination,
			pose,
			worldStateJson: worldState.current,
			constraintsJson: constraints.current,
		})
	}
</script>

{#snippet poseDescription()}
	The target pose expressed in the selected reference frame. Translations are in millimeters.
{/snippet}

<div class="flex min-w-0 flex-col gap-3">
	<PoseEditor
		{pose}
		onPoseChange={handlePoseChange}
		{fieldStatus}
		onFieldReset={(key) => {
			targets.reset(key)
		}}
		description={poseDescription}
	>
		{#snippet heading()}Destination pose{/snippet}
	</PoseEditor>

	<div class="flex flex-col gap-1">
		<div class="flex items-center gap-1">
			<span
				id={quickSetId}
				class="text-subtle-1 text-xs"
			>
				Quick set
			</span>
			<Tooltip>
				<Tooltip.Trigger class="flex shrink-0">
					<button
						type="button"
						aria-label="About Quick set"
						class="text-subtle-2 focus-ring hover:text-default flex min-h-6 min-w-6 items-center justify-center rounded-sm"
					>
						<Icon
							icon={mdiInformationOutline}
							size="sm"
						/>
					</button>
				</Tooltip.Trigger>
				<Tooltip.Content>Will update the pose values but will not execute</Tooltip.Content>
			</Tooltip>
		</div>
		<div
			role="group"
			aria-labelledby={quickSetId}
			class="flex flex-wrap gap-2"
		>
			<button
				type="button"
				class="button button-compact"
				onclick={resetToZero}
			>
				Zero
			</button>
		</div>
	</div>

	<JsonArgumentFolder
		title="World state"
		value={worldState.current}
		onValueChange={(next) => {
			worldState.current = next
		}}
		parseError={worldStateError}
	/>

	<JsonArgumentFolder
		title="Constraints"
		value={constraints.current}
		onValueChange={(next) => {
			constraints.current = next
		}}
		parseError={constraintsError}
	/>

	<div class="flex items-center gap-2">
		<button
			type="button"
			class="button button-dark button-compact"
			{disabled}
			aria-busy={isPending}
			onclick={execute}
		>
			{#if isPending}
				<span
					class="progress-dots"
					aria-hidden="true"
				></span>
			{:else}
				<Icon
					icon={mdiPlayCircleOutline}
					size="sm"
				/>
			{/if}
			Execute
		</button>
		<span role="status">
			{#if isPending}
				<Progress
					label="Executing motion"
					class="w-24"
				/>
			{/if}
		</span>
	</div>

	<p class="text-subtle-2 text-xs">
		Move blocks until the motion completes. Stop the component itself to interrupt.
	</p>
</div>
