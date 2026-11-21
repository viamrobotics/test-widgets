<script lang="ts">
	import { Tooltip } from '@viamrobotics/prime-ui'
	import { ServoClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import { createInFlightGuard } from '$lib/components/in-flight-guard.svelte'
	import { Section, useSectionErrors } from '$lib/components/section'
	import StopButton from '$lib/components/stop-button.svelte'

	import MoveToControl from './move-to-control.svelte'
	import QuickMoveControl from './quick-move-widget.svelte'
	import {
		DEFAULT_SERVO_MAX_DEGREES,
		effectiveServoMax,
		resolveServoRange,
	} from './servo-angle-limits'

	interface Props {
		partID: string
		resourceName: string
		/**
		 * The lowest angle either control reaches. A host fills it from the servo config's
		 * `min_angle_deg`. Outside 0 to 360, or not below `maxDegrees`, it is ignored. @default 0
		 */
		minDegrees?: number
		/**
		 * The highest angle either control reaches. A host fills it from the servo config's
		 * `max_angle_deg`. Given, the manual Max field is removed. Outside 0 to 360, or not above
		 * `minDegrees`, it is ignored. @default 180
		 */
		maxDegrees?: number
	}

	const { partID, resourceName, minDegrees, maxDegrees }: Props = $props()

	const POLL_INTERVAL_MS = 500

	const client = createResourceClient(
		ServoClient,
		() => partID,
		() => resourceName
	)

	const isMovingQuery = createResourceQuery(client, 'isMoving', {
		refetchInterval: POLL_INTERVAL_MS,
	})
	// Stop is never guarded, so it sends even while a Move is in flight.
	const stopMutation = createResourceMutation(client, 'stop')

	const sectionErrors = useSectionErrors(() => ({
		queries: [isMovingQuery],
		mutations: [stopMutation],
	}))

	// The steppers, the slider, and Move to 0° contradict each other, so one guard holds all three.
	const guard = createInFlightGuard()
	// The maximum the user sets in the Max field. A configured maximum overrides it.
	let userMaxDegrees = $state(DEFAULT_SERVO_MAX_DEGREES)
	const range = $derived(resolveServoRange(minDegrees, maxDegrees))
	const quickMoveMax = $derived(effectiveServoMax(range, userMaxDegrees))

	const isMoving = $derived(isMovingQuery.data === true)
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

				<Section.Body>
					<div
						role="group"
						aria-label="At a glance"
						class="flex min-w-0 items-center justify-between gap-2 @2xl:justify-start @2xl:gap-4"
					>
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

					<QuickMoveControl
						{partID}
						{resourceName}
						{guard}
						minDegrees={range.min}
						maxDegrees={quickMoveMax}
						isEmbedded
					/>
					<MoveToControl
						{partID}
						{resourceName}
						{guard}
						{minDegrees}
						{maxDegrees}
						bind:userMaxDegrees
						isEmbedded
					/>
				</Section.Body>
			</Section>
		</div>
	{/snippet}
</ConnectionStatus>
