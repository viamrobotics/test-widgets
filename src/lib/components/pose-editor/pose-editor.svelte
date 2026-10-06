<script lang="ts">
	import type { Pose } from '@viamrobotics/sdk'
	import type { Snippet } from 'svelte'

	import { Icon, IconButton, Tooltip } from '@viamrobotics/prime-core'

	import CopyButton from '$lib/components/copy-button.svelte'
	import PasteButton from '$lib/components/paste-button.svelte'
	import { degreesToRadians, radiansToDegrees } from '$lib/format'
	import {
		isUnitOrientationVector,
		normalizeOrientationVector,
	} from '$lib/normalize-orientation-vector'
	import {
		type EulerDegrees,
		eulerToOrientationVector,
		isEulerGimbalLocked,
		orientationVectorToEuler,
	} from '$lib/orientation-vector-euler'
	import { parsePastedPose } from '$lib/parse-pasted-pose'

	import type { PoseFieldStatus, PoseStatusMessage } from './pose-field-status'

	import { type EulerAngle, eulerFieldStatus } from './euler-field-status'
	import OrientationFormatMenu from './orientation-format-menu.svelte'
	import { type AngleUnit, type OrientationFormat } from './orientation-format.ts'
	import PoseEditorHint from './pose-editor-hint.svelte'
	import PoseField from './pose-field.svelte'
	import * as constants from './pose.ts'
	import RotationGizmo from './rotation-gizmo.svelte'

	interface Props {
		/** The target pose. theta is always degrees, whatever unit is displayed. */
		pose: Pose
		heading: Snippet
		/** Called with the whole pose when one field changes. theta in degrees. */
		onPoseChange: (pose: Pose) => void
		description?: Snippet
		/** Field status in stored units. When given, every field draws its restore button and states. */
		fieldStatus?: (key: keyof Pose) => PoseFieldStatus
		onFieldReset?: (key: keyof Pose) => void
		/**
		 * The consumer's wording for a field's warn or info message. Without it the editor falls back
		 * to neutral copy.
		 */
		statusMessage?: Snippet<[PoseStatusMessage]>
	}

	interface Field {
		key: keyof Pose
		label: string
		step: number
		unit?: string
		details?: string
	}

	interface EulerField {
		angle: EulerAngle
		label: string
	}

	const {
		pose,
		heading,
		description,
		fieldStatus,
		onFieldReset,
		onPoseChange,
		statusMessage,
	}: Props = $props()

	const idPrefix = $props.id()

	let format = $state<OrientationFormat>('vector')
	let unit = $state<AngleUnit>('deg')
	let isRotationEditorOpen = $state(false)

	const useRadians = $derived(unit === 'rad')
	const angleStep = $derived(useRadians ? constants.RADIAN_STEP : constants.DEGREE_STEP)

	// Copy the stored pose (theta in degrees) so it round-trips through paste
	// regardless of the display unit currently selected.
	const copyData = $derived(JSON.stringify(pose))

	const handlePaste = (data: string): boolean => {
		const parsed = parsePastedPose(data)
		if (!parsed) {
			return false
		}
		onPoseChange(parsed)
		return true
	}

	const toDisplay = (key: keyof Pose, value: number) =>
		key === 'theta' && useRadians ? degreesToRadians(value) : value

	const handleChange = (key: keyof Pose, inputValue: number) => {
		const storedValue = key === 'theta' && useRadians ? radiansToDegrees(inputValue) : inputValue
		onPoseChange({ ...pose, [key]: storedValue })
	}

	const displayStatus = (key: keyof Pose): PoseFieldStatus | undefined => {
		const status = fieldStatus?.(key)
		if (!status) {
			return undefined
		}
		return {
			...status,
			current: toDisplay(key, status.current),
			drift: status.drift === undefined ? undefined : toDisplay(key, status.drift),
		}
	}

	const toDisplayAngle = (degrees: number) => (useRadians ? degreesToRadians(degrees) : degrees)

	const targetEuler = $derived(orientationVectorToEuler(pose))

	const emitEuler = (euler: EulerDegrees) => {
		onPoseChange({ ...pose, ...eulerToOrientationVector(euler) })
	}

	const eulerStatus = (angle: EulerAngle): PoseFieldStatus | undefined => {
		if (!fieldStatus) {
			return undefined
		}
		return eulerFieldStatus(angle, pose, fieldStatus)
	}

	const displayEulerStatus = (angle: EulerAngle): PoseFieldStatus | undefined => {
		const status = eulerStatus(angle)
		if (!status) {
			return undefined
		}
		return {
			...status,
			current: toDisplayAngle(status.current),
			drift: status.drift === undefined ? undefined : toDisplayAngle(status.drift),
		}
	}

	const handleEulerChange = (angle: EulerAngle, inputValue: number) => {
		emitEuler({ ...targetEuler, [angle]: useRadians ? radiansToDegrees(inputValue) : inputValue })
	}

	const handleEulerReset = (angle: EulerAngle) => {
		const otherAnglesEdited = constants.EULER_FIELDS.some(
			(other) => other.angle !== angle && eulerStatus(other.angle)?.isEdited
		)
		if (!otherAnglesEdited) {
			for (const key of constants.ORIENTATION_RESET_KEYS) {
				onFieldReset?.(key)
			}
			return
		}
		const status = eulerStatus(angle)
		if (status) {
			emitEuler({ ...targetEuler, [angle]: status.current })
		}
	}

	const hint = $derived.by(() => {
		if (format === 'euler') {
			return isEulerGimbalLocked(targetEuler)
				? ({ tone: 'warn', text: constants.GIMBAL_HINT } as const)
				: undefined
		}

		if (isUnitOrientationVector(pose)) return undefined

		const { oX, oY, oZ } = normalizeOrientationVector(pose)
		return {
			tone: 'info',
			text: `Not unit length. Execute sends OX ${oX.toFixed(constants.ORIENTATION_VECTOR_DECIMALS)}, OY ${oY.toFixed(constants.ORIENTATION_VECTOR_DECIMALS)}, OZ ${oZ.toFixed(constants.ORIENTATION_VECTOR_DECIMALS)}.`,
		} as const
	})
</script>

{#snippet field({ key, label, step, unit, details }: Field)}
	<PoseField
		bind:value={() => toDisplay(key, pose[key]), (value) => handleChange(key, value)}
		id="{idPrefix}-{key}"
		{label}
		{details}
		{unit}
		{step}
		status={displayStatus(key)}
		{statusMessage}
		onreset={() => onFieldReset?.(key)}
	/>
{/snippet}

{#snippet eulerField({ angle, label }: EulerField)}
	<PoseField
		bind:value={
			() => toDisplayAngle(targetEuler[angle]), (value) => handleEulerChange(angle, value)
		}
		id="{idPrefix}-{angle}"
		{label}
		{unit}
		step={angleStep}
		status={displayEulerStatus(angle)}
		{statusMessage}
		onreset={() => {
			handleEulerReset(angle)
		}}
	/>
{/snippet}

{#snippet rotationEditorToggle()}
	<IconButton
		icon="axis-arrow"
		variant="ghost"
		label="Rotation editor"
		cx="ml-16 @sm:mt-5 @sm:ml-0"
		aria-expanded={isRotationEditorOpen}
		aria-controls="{idPrefix}-rotation-editor"
		onclick={() => {
			isRotationEditorOpen = !isRotationEditorOpen
		}}
	/>
{/snippet}

<div class="@container flex min-w-0 flex-col gap-4">
	<div class="flex items-center justify-between">
		<span class="flex flex-row items-center gap-1 text-sm">
			{@render heading()}
			{#if description}
				<Tooltip let:tooltipID>
					<button
						type="button"
						aria-label="More information"
						aria-describedby={tooltipID}
						class="focus-visible:ring-gray-9 inline-flex rounded focus-visible:ring-2 focus-visible:outline-none"
					>
						<Icon
							name="information-outline"
							cx="text-gray-6"
						/>
					</button>

					<span slot="description">{@render description()}</span>
				</Tooltip>
			{/if}
		</span>
		<div class="flex gap-1">
			<CopyButton data={copyData} />
			<PasteButton onPaste={handlePaste} />
		</div>
	</div>

	<div
		role="group"
		aria-label="Position, millimeters"
		class="flex flex-col gap-2"
	>
		<span class="flex items-baseline gap-1">
			<span class="text-xs font-semibold">Position</span>
			<span
				class="text-subtle-2 text-xs"
				aria-hidden="true">mm</span
			>
		</span>
		<div class={constants.ROW_CLASS}>
			{#each constants.POSITION_FIELDS as { key, label } (key)}
				{@render field({ key, label, step: constants.MILLIMETER_STEP, unit: 'mm' })}
			{/each}
		</div>
	</div>

	<div
		role="group"
		aria-labelledby="{idPrefix}-orientation-label"
		class="flex flex-col gap-2"
	>
		<OrientationFormatMenu
			labelId="{idPrefix}-orientation-label"
			bind:format
			bind:unit
		/>
		<div class={constants.ROW_CLASS}>
			{#if format === 'euler'}
				{#each constants.EULER_FIELDS as { angle, label } (angle)}
					{@render eulerField({ angle, label })}
				{/each}
			{:else}
				{#each constants.ORIENTATION_FIELDS as { key, label } (key)}
					{@render field({ key, label, step: constants.ORIENTATION_VECTOR_STEP })}
				{/each}
				{@render field({ key: 'theta', label: 'θ', step: angleStep, unit, details: unit })}
			{/if}
			{@render rotationEditorToggle()}
		</div>
		{#if isRotationEditorOpen}
			<RotationGizmo
				bind:orientation={() => pose, (next) => onPoseChange({ ...pose, ...next })}
				id="{idPrefix}-rotation-editor"
			/>
		{/if}
		<PoseEditorHint {...hint} />
	</div>
</div>
