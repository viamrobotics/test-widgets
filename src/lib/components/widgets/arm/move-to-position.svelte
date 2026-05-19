<script lang="ts">
	import type { Pose } from '@viamrobotics/sdk'

	import { Button, Icon, NumericInput, Tooltip } from '@viamrobotics/prime-core'

	import AngleUnitToggle from '$lib/components/angle-unit-toggle.svelte'
	import CopyButton from '$lib/components/copy-button.svelte'
	import ErrorDisplay from '$lib/components/error.svelte'
	import Table from '$lib/components/table.svelte'
	import { numberValueFromEvent } from '$lib/event-handlers'
	import { degreesToRadians, formatNumeric, radiansToDegrees } from '$lib/format'

	const PLAN_VALIDATION_DEBOUNCE_MS = 400

	interface Props {
		endPosition: Pose
		moveToPosition: (position: Pose) => void
		lastError: Error | null
		validatePlan?: ((position: Pose) => Promise<void>) | undefined
	}

	const { endPosition, moveToPosition, lastError, validatePlan }: Props = $props()

	// svelte-ignore state_referenced_locally
	let desiredPosition = $state({ ...endPosition })

	let planError = $state<Error | null>(null)
	let isPlanning = $state(false)

	const desiredPose = $derived({
		x: desiredPosition.x,
		y: desiredPosition.y,
		z: desiredPosition.z,
		oX: desiredPosition.oX,
		oY: desiredPosition.oY,
		oZ: desiredPosition.oZ,
		theta: desiredPosition.theta,
	})

	const displayError = $derived(planError ?? lastError)
	const canExecute = $derived(!validatePlan || (!isPlanning && planError === null))

	const runPlanValidation = async (pose: Pose) => {
		if (!validatePlan) {
			return
		}

		isPlanning = true
		planError = null
		try {
			await validatePlan(pose)
		} catch (error) {
			planError = error as Error
		} finally {
			isPlanning = false
		}
	}

	$effect(() => {
		if (!validatePlan) {
			return
		}

		const pose = desiredPose
		const timeoutId = setTimeout(() => {
			void runPlanValidation(pose)
		}, PLAN_VALIDATION_DEBOUNCE_MS)

		return () => {
			clearTimeout(timeoutId)
		}
	})

	const executeMove = async () => {
		if (validatePlan) {
			await runPlanValidation(desiredPose)
			if (planError !== null) {
				return
			}
		}

		moveToPosition(desiredPose)
	}

	let useRadians = $state(false)

	const resetToZero = () => {
		desiredPosition = {
			x: 0,
			y: 0,
			z: 0,
			oX: 0,
			oY: 0,
			oZ: 0,
			theta: 0,
		}
	}

	const resetToCurrent = () => {
		desiredPosition = { ...endPosition }
	}

	const displayPosition = $derived({
		x: desiredPosition.x,
		y: desiredPosition.y,
		z: desiredPosition.z,
		oX: desiredPosition.oX,
		oY: desiredPosition.oY,
		oZ: desiredPosition.oZ,
		theta: useRadians ? degreesToRadians(desiredPosition.theta) : desiredPosition.theta,
	})

	const copyData = $derived(
		`{x: ${displayPosition.x}, y: ${displayPosition.y}, z: ${displayPosition.z}, o_x: ${displayPosition.oX}, o_y: ${displayPosition.oY}, o_z: ${displayPosition.oZ}, theta: ${displayPosition.theta}}`
	)

	const handleAngleInputChange = (key: keyof Pose, inputValue: number) => {
		if (key === 'theta') {
			desiredPosition[key] = useRadians ? radiansToDegrees(inputValue) : inputValue
		} else {
			desiredPosition[key] = inputValue
		}
	}

	const positionLabels: Record<keyof Pose, string> = {
		x: 'X',
		y: 'Y',
		z: 'Z',
		oX: 'OX',
		oY: 'OY',
		oZ: 'OZ',
		theta: 'θ',
	} as const
	const positionLabelsList = Object.entries(positionLabels) as [keyof Pose, string][]
</script>

<div class="flex min-w-0 flex-col gap-4">
	<!-- Controls Header -->
	<div class="flex items-center justify-between">
		<span class="text-sm">Pose Values</span>
		<div class="flex gap-1">
			<AngleUnitToggle
				{useRadians}
				onToggle={() => {
					useRadians = !useRadians
				}}
			/>
			<CopyButton data={copyData} />
		</div>
	</div>

	<Table>
		<thead>
			<tr>
				<th>Pose</th>
				<th>Value ({useRadians ? 'radians' : 'degrees'})</th>
			</tr>
		</thead>
		<tbody>
			{#each positionLabelsList as labelList (labelList)}
				{@const [key, label] = labelList}
				{@const value = Number.parseFloat(formatNumeric(displayPosition[key]))}
				<tr>
					<th>{label}</th>
					<th>
						<NumericInput
							cx="max-w-[76px]"
							{value}
							on:change={(event) => {
								const inputValue = numberValueFromEvent(event) ?? 0
								handleAngleInputChange(key, inputValue)
							}}
						/>
					</th>
				</tr>
			{/each}
		</tbody>
	</Table>

	<div class="mb-2 flex flex-col gap-2">
		<span class="flex flex-row gap-2">
			<h4 class="text-xs font-semibold">Quick set</h4>
			<Tooltip>
				<Icon
					name="information-outline"
					cx="text-gray-6"
				/>

				<span slot="description"> Will update the pose values but will not execute </span>
			</Tooltip>
		</span>
		<div class="flex flex-col gap-2 sm:flex-row">
			<Button onclick={resetToZero}>Zero</Button>
			<Button onclick={resetToCurrent}>Current position</Button>
		</div>
	</div>
	<Button
		class="mt-auto w-fit"
		disabled={!canExecute}
		icon="play-circle-outline"
		variant="dark"
		onclick={executeMove}
	>
		Execute
	</Button>
	<ErrorDisplay lastError={displayError} />
</div>
