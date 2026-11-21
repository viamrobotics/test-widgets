<script lang="ts">
	import { mdiBackupRestore } from '@mdi/js'
	import { NumberField, Slider } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'
	import { ServoClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import type { InFlightGuard } from '$lib/components/in-flight-guard.svelte'

	import { createInFlightGuard } from '$lib/components/in-flight-guard.svelte'
	import { Section, useSectionErrors } from '$lib/components/section'
	import { errorKey } from '$lib/components/section/error-key'
	import StatusLine from '$lib/components/status-line.svelte'

	import {
		DEFAULT_SERVO_MAX_DEGREES,
		effectiveServoMax,
		MINIMUM_SPAN_DEGREES,
		resolveServoRange,
		SERVO_MAX_DEGREES_CAP,
	} from './servo-angle-limits'

	interface Props {
		partID: string
		resourceName: string
		/**
		 * The servo's one conflict group. Pass the guard `ServoQuickMoveControl` shares, so only one
		 * servo move is in flight. Absent, the control makes its own.
		 */
		guard?: InFlightGuard
		/**
		 * The slider's lowest angle. A host fills it from the servo config's `min_angle_deg`. Outside
		 * 0 to 360, or not below `maxDegrees`, it is ignored. @default 0
		 */
		minDegrees?: number
		/**
		 * The slider's highest angle. A host fills it from the servo config's `max_angle_deg`. Given,
		 * the manual Max field is removed. Outside 0 to 360, or not above `minDegrees`, it is
		 * ignored. @default 180
		 */
		maxDegrees?: number
		/** The highest angle the user set in the Max field, used when no maximum is configured. @default 180 */
		userMaxDegrees?: number
		/**
		 * Draws the controls with no heading of their own, for a host that titles them, and adds
		 * their errors to the enclosing section's indicator. @default false
		 */
		isEmbedded?: boolean
	}

	let {
		partID,
		resourceName,
		guard: sharedGuard,
		minDegrees,
		maxDegrees,
		userMaxDegrees = $bindable(DEFAULT_SERVO_MAX_DEGREES),
		isEmbedded = false,
	}: Props = $props()

	const POLL_INTERVAL_MS = 500

	const client = createResourceClient(
		ServoClient,
		() => partID,
		() => resourceName
	)

	const positionQuery = createResourceQuery(client, 'getPosition', {
		refetchInterval: POLL_INTERVAL_MS,
	})
	const moveMutation = createResourceMutation(client, 'move')

	const sectionErrors = useSectionErrors(() => ({
		queries: [positionQuery],
		mutations: [moveMutation],
	}))

	const ownGuard = createInFlightGuard()
	const guard = $derived(sharedGuard ?? ownGuard)

	// The thumb while it is dragged, until its release settles. Undefined, the thumb follows the servo.
	let draggedTo = $state<number | undefined>()
	// The angle of this control's Move in flight.
	let movingTo = $state<number | undefined>()

	const range = $derived(resolveServoRange(minDegrees, maxDegrees))
	const lowest = $derived(range.min)
	const highest = $derived(effectiveServoMax(range, userMaxDegrees))
	const hasConfiguredMax = $derived(range.max !== undefined)
	// The user's Max stays above the minimum so the slider keeps a span.
	const lowestUserMax = $derived(lowest + MINIMUM_SPAN_DEGREES)

	const clampAngle = (angle: number) => Math.min(Math.max(angle, lowest), highest)

	const sliderValue = $derived(clampAngle(draggedTo ?? movingTo ?? positionQuery.data ?? lowest))
	// Another move holds the group. The slider's own Move keeps it enabled, so keyboard focus stays on it.
	const isSliderDisabled = $derived(guard.isBusy && draggedTo === undefined)
	const statusText = $derived(movingTo === undefined ? '' : `Moving to ${movingTo}°`)

	const setSliderValue = (value: number) => {
		draggedTo = value
	}

	// The field holds what was typed, so it can be emptied and retyped. Max itself is held to one above the minimum up to 360,
	// and an emptied field keeps the last Max.
	let maxField = $state<number | undefined>(userMaxDegrees)

	const isMaxFieldValid = $derived(
		maxField !== undefined &&
			Number.isFinite(maxField) &&
			maxField >= lowestUserMax &&
			maxField <= SERVO_MAX_DEGREES_CAP
	)

	const setMaxField = (value: number | undefined) => {
		maxField = value
		if (value === undefined || !Number.isFinite(value)) return
		userMaxDegrees = Math.min(Math.max(value, lowestUserMax), SERVO_MAX_DEGREES_CAP)
	}

	const moveTo = async (angle: number) => {
		const outcome = await guard.run(() => {
			movingTo = angle
			return moveMutation.mutateAsync([angle])
		})
		if (outcome === undefined) return
		movingTo = undefined
	}

	// Only the change event moves the servo. The input event of a drag moves the thumb alone.
	const release = async (event: Event) => {
		const target = event.target
		const angle =
			target instanceof HTMLInputElement && Number.isFinite(target.valueAsNumber)
				? clampAngle(target.valueAsNumber)
				: draggedTo
		if (angle === undefined) return
		draggedTo = angle
		await moveTo(angle)
		draggedTo = undefined
	}

	const moveToLowest = () => moveTo(lowest)
	const lowestLabel = $derived(`Move to ${lowest}°`)
</script>

{#snippet controls()}
	<Section.Body isLoading={sectionErrors.isLoading}>
		<div class="flex w-full min-w-0 flex-col gap-2">
			<!-- The slider's range and readout both bubble their change event here. -->
			<div onchange={release}>
				<Slider
					label="Move to"
					suffix="°"
					min={lowest}
					max={highest}
					step={1}
					disabled={isSliderDisabled}
					bind:value={() => sliderValue, setSliderValue}
				/>
			</div>
			<div class="flex flex-wrap items-end gap-2">
				{#if !hasConfiguredMax}
					<div class="w-28">
						<NumberField
							label="Max"
							suffix="°"
							min={lowestUserMax}
							max={SERVO_MAX_DEGREES_CAP}
							step={1}
							state={isMaxFieldValid ? undefined : 'error'}
							bind:value={() => maxField, setMaxField}
						/>
					</div>
				{/if}
				<button
					type="button"
					class="button button-xs ml-auto"
					disabled={guard.isBusy}
					onclick={moveToLowest}
				>
					<Icon
						icon={mdiBackupRestore}
						size="sm"
					/>
					{lowestLabel}
				</button>
			</div>
			<StatusLine text={statusText} />
		</div>
	</Section.Body>
{/snippet}

{#if isEmbedded}
	{#each sectionErrors.errors as error (errorKey(error))}
		<Section.Error {error} />
	{/each}
	{@render controls()}
{:else}
	<Section
		errorReporter={sectionErrors}
		class="grow flex-col gap-3"
	>
		<Section.Heading>
			Move to
			{#snippet aside()}
				<Section.Errors errors={sectionErrors.errors} />
			{/snippet}
		</Section.Heading>
		{@render controls()}
	</Section>
{/if}
