<script lang="ts">
	import { EncoderClient, EncoderPositionType } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import ConfirmStep from '$lib/components/confirm-step.svelte'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import { createInFlightGuard } from '$lib/components/in-flight-guard.svelte'
	import { Section, useSectionErrors } from '$lib/components/section'
	import StatusLine from '$lib/components/status-line.svelte'

	import Position from './position.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const POLL_INTERVAL_MS = 500

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
		() => ({ enabled: isAngleSupported, refetchInterval: POLL_INTERVAL_MS })
	)
	const ticksQuery = createResourceQuery(
		client,
		'getPosition',
		[EncoderPositionType.TICKS_COUNT],
		() => ({ enabled: isTicksSupported, refetchInterval: POLL_INTERVAL_MS })
	)
	const resetMutation = createResourceMutation(client, 'resetPosition')

	const sectionErrors = useSectionErrors(() => ({
		queries: [propertiesQuery, angleQuery, ticksQuery],
		mutations: [resetMutation],
	}))

	// A second reset would zero a position the person never saw, so a reset never queues.
	const guard = createInFlightGuard()

	let isArmed = $state(false)

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
	const refetchPositions = () => {
		if (isAngleSupported) void angleQuery.refetch()
		if (isTicksSupported) void ticksQuery.refetch()
	}

	const reset = () => {
		const outcome = guard.run(() => resetMutation.mutateAsync([]))
		void outcome?.then(refetchPositions)
		return outcome
	}

	const statusText = $derived.by(() => {
		if (guard.isBusy) return 'Resetting to zero.'
		if (isArmed) return 'Confirm to zero the position.'
		return ''
	})
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="@container min-w-0">
			<Section
				errorReporter={sectionErrors}
				class="min-w-0 flex-col gap-3 p-2"
			>
				<Section.Heading class="justify-between">
					Controls
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
								disabled={guard.isBusy}
								onconfirm={reset}
								bind:isArmed
							/>
						</div>
						<StatusLine text={statusText} />
					</div>
				</Section.Body>
			</Section>
		</div>
	{/snippet}
</ConnectionStatus>
