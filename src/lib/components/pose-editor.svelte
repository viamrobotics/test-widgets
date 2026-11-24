<script
	lang="ts"
	module
>
	import type { PointAxis } from '@viamrobotics/prime-controls'
	import type { Pose } from '@viamrobotics/sdk'

	type PoseKey = keyof Pose

	const POSE_KEYS: PoseKey[] = ['x', 'y', 'z', 'oX', 'oY', 'oZ', 'theta']

	const FIELD_LABELS: Record<PoseKey, string> = {
		x: 'X',
		y: 'Y',
		z: 'Z',
		oX: 'OX',
		oY: 'OY',
		oZ: 'OZ',
		theta: 'θ',
	}

	const POSITION_KEYS: Partial<Record<PointAxis, PoseKey>> = { x: 'x', y: 'y', z: 'z' }
	const ORIENTATION_KEYS: Partial<Record<PointAxis, PoseKey>> = { x: 'oX', y: 'oY', z: 'oZ' }
	const ORIENTATION_LABELS = { x: FIELD_LABELS.oX, y: FIELD_LABELS.oY, z: FIELD_LABELS.oZ }

	const POSITION_STEP = 0.1
	const ORIENTATION_STEP = 0.01
	const THETA_DEGREES_STEP = 0.1
	const THETA_RADIANS_STEP = 0.01

	export interface PoseFieldStatus {
		current: number
		isEdited: boolean
		drift: number | undefined
		isMoving: boolean
	}
</script>

<script lang="ts">
	import type { FieldState } from '@viamrobotics/prime-ui'
	import type { Snippet } from 'svelte'

	import { mdiInformationOutline } from '@mdi/js'
	import { NumberField, Point, type PointValue } from '@viamrobotics/prime-controls'
	import { Hint, Icon, Tooltip } from '@viamrobotics/prime-ui'

	import AngleUnitToggle from '$lib/components/angle-unit-toggle.svelte'
	import CopyButton from '$lib/components/copy-button.svelte'
	import PasteButton from '$lib/components/paste-button.svelte'
	import ResetToCurrentButton from '$lib/components/reset-to-current-button.svelte'
	import { degreesToRadians, formatNumeric, radiansToDegrees } from '$lib/format'
	import { parsePastedPose } from '$lib/parse-pasted-pose'

	interface Props {
		pose: Pose
		heading: Snippet
		onPoseChange: (pose: Pose) => void
		description?: Snippet
		fieldStatus?: (key: keyof Pose) => PoseFieldStatus
		onFieldReset?: (key: keyof Pose) => void
	}

	const { pose, heading, description, fieldStatus, onFieldReset, onPoseChange }: Props = $props()

	const uid = $props.id()
	const headingId = `${uid}-heading`
	const aboutId = `${uid}-about`
	const statusId = (key: PoseKey) => `${uid}-${key}-status`

	let useRadians = $state(false)

	interface TypedValue {
		shown: number
		stored: number
	}

	// The number under the cursor, kept unrounded while the pose still holds it, so a field
	// bound per keystroke never rewrites a third decimal the user is typing.
	let typed = $state<Partial<Record<PoseKey, TypedValue>>>({})

	const toDisplay = (key: PoseKey, value: number) =>
		key === 'theta' && useRadians ? degreesToRadians(value) : value

	const shownValue = (key: PoseKey): number => {
		const entry = typed[key]
		if (entry?.stored === pose[key]) {
			return entry.shown
		}
		return Number.parseFloat(formatNumeric(toDisplay(key, pose[key])))
	}

	const positionValue: PointValue = $derived({
		x: shownValue('x'),
		y: shownValue('y'),
		z: shownValue('z'),
	})
	const orientationValue: PointValue = $derived({
		x: shownValue('oX'),
		y: shownValue('oY'),
		z: shownValue('oZ'),
	})
	const thetaValue: number = $derived(shownValue('theta'))

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

	const handleValueChange = (key: PoseKey, inputValue: number) => {
		const stored = key === 'theta' && useRadians ? radiansToDegrees(inputValue) : inputValue
		typed = { ...typed, [key]: { shown: inputValue, stored } }
		onPoseChange({ ...pose, [key]: stored })
	}

	const handlePointChange = (
		keys: Partial<Record<PointAxis, PoseKey>>,
		previous: PointValue,
		next: PointValue
	) => {
		for (const axis of ['x', 'y', 'z'] satisfies PointAxis[]) {
			const key = keys[axis]
			const value = next[axis]
			if (key !== undefined && value !== undefined && value !== previous[axis]) {
				handleValueChange(key, value)
			}
		}
	}

	const units = $derived<Record<PoseKey, string>>({
		x: ' mm',
		y: ' mm',
		z: ' mm',
		oX: '',
		oY: '',
		oZ: '',
		theta: useRadians ? ' rad' : '°',
	})

	// A pose always holds a number for theta, so an emptied field writes nothing. This lets the field
	// stay empty while the user types, as Point does for its axes, until a number or a blur.
	let isThetaCleared = $state(false)

	const writeTheta = (next: number | undefined) => {
		isThetaCleared = next === undefined
		if (next !== undefined) {
			handleValueChange('theta', next)
		}
	}

	interface StatusIndicator {
		state: FieldState
		message: string
	}

	const statusIndicator = (key: PoseKey): StatusIndicator | undefined => {
		const status = fieldStatus?.(key)
		if (status?.drift !== undefined) {
			const amount = formatNumeric(toDisplay(key, status.drift))
			return { state: 'warn', message: `Arm moved ${amount}${units[key]}.` }
		}
		if (status?.isEdited && status.isMoving) {
			return { state: 'info', message: 'The arm is moving. Your edit is kept.' }
		}
		return undefined
	}

	const indicators = $derived.by(() => {
		const byKey: Partial<Record<PoseKey, StatusIndicator>> = {}
		for (const key of POSE_KEYS) {
			byKey[key] = statusIndicator(key)
		}
		return byKey
	})
</script>

{#snippet fieldDetails(key: PoseKey)}
	{@const indicator = indicators[key]}
	{#if indicator}
		<Hint
			id={statusId(key)}
			state={indicator.state}
		>
			{indicator.message}
		</Hint>
	{/if}
{/snippet}

{#snippet fieldReset(key: PoseKey)}
	{@const status = fieldStatus?.(key)}
	{#if status && onFieldReset}
		<ResetToCurrentButton
			label={FIELD_LABELS[key]}
			current="{formatNumeric(toDisplay(key, status.current))}{units[key]}"
			isEdited={status.isEdited}
			onreset={() => {
				onFieldReset(key)
			}}
		/>
	{/if}
{/snippet}

{#snippet pointReset(keys: Partial<Record<PointAxis, PoseKey>>, axis: PointAxis)}
	{@const key = keys[axis]}
	{#if key}
		{@render fieldReset(key)}
	{/if}
{/snippet}

{#snippet pointDetails(keys: Partial<Record<PointAxis, PoseKey>>, axis: PointAxis)}
	{@const key = keys[axis]}
	{#if key}
		{@render fieldDetails(key)}
	{/if}
{/snippet}

<div class="@container flex min-w-0 flex-col gap-2">
	<div class="flex items-center gap-1">
		<div class="flex min-w-0 flex-1 items-center gap-1">
			<span
				id={headingId}
				class="text-subtle-1 min-w-0 truncate text-xs"
			>
				{@render heading()}
			</span>
			{#if description}
				<Tooltip>
					<Tooltip.Trigger class="flex shrink-0">
						<button
							id={aboutId}
							type="button"
							aria-label="About"
							aria-labelledby="{aboutId} {headingId}"
							class="text-subtle-2 focus-ring hover:text-default flex min-h-6 min-w-6 items-center justify-center rounded-sm"
						>
							<Icon
								icon={mdiInformationOutline}
								size="sm"
							/>
						</button>
					</Tooltip.Trigger>
					<Tooltip.Content class="max-w-72 text-xs">{@render description()}</Tooltip.Content>
				</Tooltip>
			{/if}
		</div>
		<AngleUnitToggle
			{useRadians}
			onToggle={() => {
				useRadians = !useRadians
				typed = { ...typed, theta: undefined }
			}}
		/>
		<CopyButton data={copyData} />
		<PasteButton onPaste={handlePaste} />
	</div>

	<!-- Two columns from the width where each holds its three axes in one row. Point stacks them under 22rem. -->
	<div
		role="group"
		aria-labelledby={headingId}
		class="grid grid-cols-1 items-start gap-2 @min-[45rem]:grid-cols-2 @min-[45rem]:gap-4"
	>
		<Point
			label="Position, mm"
			step={POSITION_STEP}
			axes={{
				x: { state: indicators.x?.state, describedBy: indicators.x && statusId('x') },
				y: { state: indicators.y?.state, describedBy: indicators.y && statusId('y') },
				z: { state: indicators.z?.state, describedBy: indicators.z && statusId('z') },
			}}
			bind:value={
				() => positionValue,
				(next) => {
					handlePointChange(POSITION_KEYS, positionValue, next)
				}
			}
		>
			{#snippet details(axis)}
				{@render pointDetails(POSITION_KEYS, axis)}
			{/snippet}
			{#snippet trailing(axis)}
				{@render pointReset(POSITION_KEYS, axis)}
			{/snippet}
		</Point>

		<div class="flex min-w-0 flex-col gap-2">
			<Point
				label="Orientation"
				labels={ORIENTATION_LABELS}
				step={ORIENTATION_STEP}
				axes={{
					x: { state: indicators.oX?.state, describedBy: indicators.oX && statusId('oX') },
					y: { state: indicators.oY?.state, describedBy: indicators.oY && statusId('oY') },
					z: { state: indicators.oZ?.state, describedBy: indicators.oZ && statusId('oZ') },
				}}
				bind:value={
					() => orientationValue,
					(next) => {
						handlePointChange(ORIENTATION_KEYS, orientationValue, next)
					}
				}
			>
				{#snippet details(axis)}
					{@render pointDetails(ORIENTATION_KEYS, axis)}
				{/snippet}
				{#snippet trailing(axis)}
					{@render pointReset(ORIENTATION_KEYS, axis)}
				{/snippet}
			</Point>

			<div class="flex min-w-0 flex-col gap-1">
				<NumberField
					label={FIELD_LABELS.theta}
					suffix={useRadians ? 'rad' : '°'}
					step={useRadians ? THETA_RADIANS_STEP : THETA_DEGREES_STEP}
					state={indicators.theta?.state}
					aria-describedby={indicators.theta && statusId('theta')}
					onblur={() => {
						isThetaCleared = false
					}}
					bind:value={() => (isThetaCleared ? undefined : thetaValue), writeTheta}
				>
					{#snippet trailing()}
						{@render fieldReset('theta')}
					{/snippet}
				</NumberField>
				{@render fieldDetails('theta')}
			</div>
		</div>
	</div>
</div>
