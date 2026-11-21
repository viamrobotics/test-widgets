<script lang="ts">
	import { Tooltip } from '@viamrobotics/prime-ui'
	import { GantryClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import { createInFlightGuard } from '$lib/components/in-flight-guard.svelte'
	import { Section, useSectionErrors } from '$lib/components/section'
	import StopButton from '$lib/components/stop-button.svelte'

	import HomedReadout from './homed-readout.svelte'
	import { HOMING_STATUS } from './homing-status'
	import QuickMoveControl from './quick-move-widget.svelte'

	interface Props {
		partID: string
		resourceName: string
		/**
		 * Axis names in `GetLengths` order, from a multi-axis gantry's `subaxes_list` config key.
		 * Ignored unless the list is as long as the lengths.
		 */
		axisNames?: string[]
		/**
		 * One speed per axis in mm/s, from each single-axis `gantry_mm_per_sec` config key. The
		 * smallest finite entry above 0 seeds the Speed field.
		 */
		defaultSpeedsMmPerSec?: number[]
	}

	const { partID, resourceName, axisNames, defaultSpeedsMmPerSec }: Props = $props()

	const POLL_INTERVAL_MS = 500

	const client = createResourceClient(
		GantryClient,
		() => partID,
		() => resourceName
	)

	const isMovingQuery = createResourceQuery(client, 'isMoving', {
		refetchInterval: POLL_INTERVAL_MS,
	})
	// Stop is never guarded, so it sends even while a step or Home is in flight.
	const stopMutation = createResourceMutation(client, 'stop')
	const homeMutation = createResourceMutation(client, 'home')

	const sectionErrors = useSectionErrors(() => ({
		queries: [isMovingQuery],
		mutations: [stopMutation, homeMutation],
	}))

	// Every MoveToPosition carries every axis, so two jogs contradict, and Home moves them all. One guard holds them.
	const guard = createInFlightGuard()

	let isHoming = $state(false)
	let quickMove = $state<ReturnType<typeof QuickMoveControl>>()

	const isMoving = $derived(isMovingQuery.data === true)

	const home = async () => {
		const outcome = await guard.run(() => {
			isHoming = true
			return homeMutation.mutateAsync([])
		})
		if (outcome === undefined) return
		isHoming = false
	}

	const stop = () => {
		quickMove?.endHold()
		stopMutation.mutate([], {})
	}
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

				<Section.Body>
					<div
						role="group"
						aria-label="At a glance"
						class="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2"
					>
						<div class="flex items-center gap-2">
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
							<StopButton onStop={stop} />
						</div>
						<div class="flex items-center gap-3">
							<button
								type="button"
								class="button button-xs"
								aria-busy={isHoming}
								aria-disabled={guard.isBusy || undefined}
								onclick={home}
							>
								{#if isHoming}
									<span
										class="progress-dots"
										aria-hidden="true"
									></span>
								{/if}
								Home
							</button>
							<HomedReadout isHomed={homeMutation.data} />
						</div>
					</div>

					<QuickMoveControl
						bind:this={quickMove}
						{partID}
						{resourceName}
						{guard}
						{axisNames}
						{defaultSpeedsMmPerSec}
						busyStatus={isHoming ? HOMING_STATUS : undefined}
						isEmbedded
					/>
				</Section.Body>
			</Section>
		</div>
	{/snippet}
</ConnectionStatus>
