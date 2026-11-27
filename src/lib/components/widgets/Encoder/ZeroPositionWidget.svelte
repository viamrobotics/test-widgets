<script lang="ts">
	import { EncoderClient, EncoderPositionType } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'
	import ConfirmStep from '#lib/components/ConfirmStep.svelte'
	import { createRefetchIntervalStore } from '#lib/components/refetch-interval-store.svelte.js'
	import RefetchController from '#lib/components/RefetchController.svelte'
	import { Section, useSectionErrors } from '#lib/components/Section/index.js'
	import StatusLine from '#lib/components/StatusLine.svelte'
	import { untrack } from 'svelte'

	import { useEncoderState } from './encoder-state.svelte'
	import Position from './Position.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const BUSY_REASON = 'Wait for the reset in flight to finish.'

	const refetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'encoder/zeroPosition'
	)

	const client = createResourceClient(
		EncoderClient,
		() => partID,
		() => resourceName
	)

	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: false })

	const isAngleSupported = $derived(propertiesQuery.data?.angleDegreesSupported === true)
	const isTicksSupported = $derived(propertiesQuery.data?.ticksCountSupported === true)

	// A GetPosition request takes one position type, so each supported type polls on its own.
	const angleQuery = createResourceQuery(
		client,
		'getPosition',
		[EncoderPositionType.ANGLE_DEGREES],
		() => ({ enabled: isAngleSupported, refetchInterval: refetchInterval.current })
	)
	const ticksQuery = createResourceQuery(
		client,
		'getPosition',
		[EncoderPositionType.TICKS_COUNT],
		() => ({ enabled: isTicksSupported, refetchInterval: refetchInterval.current })
	)
	const resetMutation = createResourceMutation(client, 'resetPosition')

	const sectionErrors = useSectionErrors(() => ({
		queries: [propertiesQuery, angleQuery, ticksQuery],
		mutations: [resetMutation],
	}))

	const encoderState = untrack(() => useEncoderState(partID, resourceName))
	const resetGuard = encoderState.reset

	let isArmed = $state(false)

	const busyReason = $derived(resetGuard.isBusy ? BUSY_REASON : undefined)

	const readouts = $derived.by(() => {
		if (isAngleSupported && isTicksSupported) {
			return [
				{ label: 'Angle', data: angleQuery.data },
				{ label: 'Ticks', data: ticksQuery.data },
			]
		}
		if (isTicksSupported) return [{ label: 'Position', data: ticksQuery.data }]
		return [{ label: 'Position', data: angleQuery.data }]
	})

	// A refetch ignores `enabled`, so only a supported type is read again.
	const supportedQueries = $derived([
		...(isAngleSupported ? [angleQuery] : []),
		...(isTicksSupported ? [ticksQuery] : []),
	])

	const refetchPositions = () => {
		for (const query of supportedQueries) void query.refetch()
	}

	const reset = () => {
		const outcome = encoderState.runReset(() => resetMutation.mutateAsync([]))
		void outcome?.then(refetchPositions)
		return outcome
	}

	const statusText = $derived.by(() => {
		if (resetGuard.isBusy) return 'Resetting to zero.'
		if (isArmed) return 'Confirm to zero the position.'
		if (encoderState.lastResetOutcome === 'failed') return 'Reset failed'
		return ''
	})
</script>

<div class="@container flex min-w-0 grow flex-col">
	<Section
		errorReporter={sectionErrors}
		class="min-w-0 grow flex-col gap-3 p-2"
	>
		<Section.Heading class="justify-between">
			Zero position
			{#snippet aside()}
				<Section.Errors errors={sectionErrors.errors} />
			{/snippet}
		</Section.Heading>

		<!-- Reset to zero needs no read, so the body stays drawn and pressable on the first load. -->
		<Section.Body
			isLoading={sectionErrors.isLoading}
			skeleton
		>
			<div class="flex w-full min-w-0 flex-col gap-1">
				<div class="flex min-w-0 flex-col gap-1 @2xl:flex-row @2xl:items-center @2xl:gap-2">
					{#each readouts as readout (readout.label)}
						<div class="min-w-0 @2xl:flex-1">
							<Position
								label={readout.label}
								data={readout.data}
							/>
						</div>
					{/each}
					<ConfirmStep
						label="Reset to zero"
						confirmLabel="Confirm reset"
						isConfirmRequired
						blockedReason={busyReason}
						onconfirm={reset}
						bind:isArmed
					/>
				</div>
				<StatusLine text={statusText} />
				<RefetchController
					{refetchInterval}
					queries={supportedQueries}
				/>
			</div>
		</Section.Body>
	</Section>
</div>
