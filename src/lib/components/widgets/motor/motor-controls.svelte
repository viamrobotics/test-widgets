<script lang="ts">
	import { Folder } from '@viamrobotics/prime-controls'
	import { StatusDot, Tooltip } from '@viamrobotics/prime-ui'
	import { MotorClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import { Section, useSectionErrors } from '$lib/components/section'
	import StopButton from '$lib/components/stop-button.svelte'

	import { formatPositionReadout, formatPowerReadout } from './motor-readout-format'
	import MoveControl from './move-control.svelte'
	import QuickMoveControl from './quick-move-widget.svelte'

	interface Props {
		partID: string
		resourceName: string
		/**
		 * The most RPM a send may carry, from the gpio motor config's `max_rpm`, in revolutions per
		 * minute. Used only when finite and above 0. @default undefined
		 */
		maxRpm?: number
		/**
		 * The lowest power fraction the quick move slider reaches, from the gpio motor config's
		 * `min_power_pct`, a fraction from 0 to 1. @default 0
		 */
		minPowerPct?: number
		/**
		 * The highest power fraction the quick move slider reaches, from the gpio motor config's
		 * `max_power_pct`, a fraction from 0 to 1. @default 1
		 */
		maxPowerPct?: number
	}

	const { partID, resourceName, maxRpm, minPowerPct, maxPowerPct }: Props = $props()

	const POLL_INTERVAL_MS = 500
	const NO_POWER_FRACTION = 0

	const idPrefix = $props.id()
	const powerLabelId = `${idPrefix}-power`
	const positionLabelId = `${idPrefix}-position`

	const client = createResourceClient(
		MotorClient,
		() => partID,
		() => resourceName
	)

	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: false })
	const isMovingQuery = createResourceQuery(client, 'isMoving', {
		refetchInterval: POLL_INTERVAL_MS,
	})
	const isPoweredQuery = createResourceQuery(client, 'isPowered', {
		refetchInterval: POLL_INTERVAL_MS,
	})

	const reportsPosition = $derived(propertiesQuery.data?.positionReporting === true)

	const positionQuery = createResourceQuery(client, 'getPosition', () => ({
		enabled: reportsPosition,
		refetchInterval: POLL_INTERVAL_MS,
	}))

	const stopMutation = createResourceMutation(client, 'stop')

	// The composed controls add their own errors through `Section.Error`, so one indicator holds every call's.
	const sectionErrors = useSectionErrors(() => ({
		queries: [propertiesQuery, isMovingQuery, isPoweredQuery, positionQuery],
		mutations: [stopMutation],
	}))

	const isMoving = $derived(isMovingQuery.data === true)
	const isPowered = $derived(isPoweredQuery.data?.[0] === true)
	const powerFraction = $derived(isPoweredQuery.data?.[1] ?? NO_POWER_FRACTION)
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<!-- The container sits outside the section padding, so a 672 px pane reaches `@2xl`. -->
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

				<!-- Position and Move wait on GetProperties, so the body holds until the first loads land. -->
				<Section.Body isLoading={sectionErrors.isLoading}>
					<div
						role="group"
						aria-label="At a glance"
						class="flex min-w-0 flex-col gap-2 @2xl:flex-row @2xl:items-center @2xl:gap-4"
					>
						<div class="flex items-center justify-between gap-2 @2xl:gap-4">
							<Tooltip>
								<Tooltip.Trigger>
									<!-- Keyboard focus is the only way to open the tooltip without a pointer. -->
									<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
									<span
										class={['badge', isMoving ? 'badge-success' : 'badge-neutral']}
										tabindex="0"
									>
										{isMoving ? 'Moving' : 'Idle'}
									</span>
								</Tooltip.Trigger>
								<Tooltip.Content>Updates automatically</Tooltip.Content>
							</Tooltip>
							<StopButton
								onStop={() => {
									stopMutation.mutate([], {})
								}}
							/>
						</div>

						<div class="flex min-w-0 items-center gap-2 @2xl:w-48">
							<span
								id={powerLabelId}
								class="text-subtle-1 w-14 shrink-0 text-xs"
							>
								Power
							</span>
							<span
								role="group"
								aria-labelledby={powerLabelId}
								class="readout font-roboto-mono"
							>
								<span class="readout-value inline-flex items-center gap-2">
									{#if isPoweredQuery.data !== undefined}
										<StatusDot
											state={isPowered ? 'success' : 'danger'}
											label={isPowered ? 'Powered' : 'Not powered'}
										/>
									{/if}
									{formatPowerReadout(isPowered, powerFraction)}
								</span>
							</span>
						</div>

						{#if reportsPosition}
							<div class="flex min-w-0 items-center gap-2 @2xl:w-48">
								<span
									id={positionLabelId}
									class="text-subtle-1 w-14 shrink-0 text-xs"
								>
									Position
								</span>
								<span
									role="group"
									aria-labelledby={positionLabelId}
									class="readout font-roboto-mono"
								>
									<span class="readout-value">
										{#if positionQuery.data !== undefined}
											{formatPositionReadout(positionQuery.data)}
										{/if}
									</span>
									<span class="readout-suffix">rev</span>
								</span>
							</div>
						{/if}
					</div>

					<div class="flex min-w-0 flex-col gap-3 @2xl:flex-row @2xl:gap-4">
						<Folder
							title="Quick move"
							class="min-w-0 flex-1 @2xl:max-w-80"
						>
							<QuickMoveControl
								{partID}
								{resourceName}
								{maxRpm}
								{minPowerPct}
								{maxPowerPct}
								isEmbedded
							/>
						</Folder>
						{#if reportsPosition}
							<Folder
								title="Move"
								class="min-w-0 flex-1 @2xl:max-w-80"
							>
								<MoveControl
									{partID}
									{resourceName}
									{maxRpm}
									isEmbedded
								/>
							</Folder>
						{/if}
					</div>
				</Section.Body>
			</Section>
		</div>
	{/snippet}
</ConnectionStatus>
