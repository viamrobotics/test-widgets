<script lang="ts">
	import { Folder } from '@viamrobotics/prime-controls'
	import { Tooltip } from '@viamrobotics/prime-ui'
	import { ArmClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
		useResourceStatuses,
	} from '@viamrobotics/svelte-sdk'

	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import { createInFlightGuard } from '$lib/components/in-flight-guard.svelte'
	import { Section, useSectionErrors } from '$lib/components/section'
	import StopButton from '$lib/components/stop-button.svelte'

	import ArmJogControl from './arm-jog-control.svelte'
	import { createArmJogSteps } from './arm-jog-steps.svelte'
	import ArmJointsControl from './arm-joints-control.svelte'
	import ArmStepsFolder, { type ArmStepField } from './arm-steps-folder.svelte'
	import ArmManualModeControl from './manual-mode-widget.svelte'
	import { moveMotionServiceName } from './move-control-mode'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const POLL_INTERVAL_MS = 500
	const MANUAL_MODE_REFETCH_INTERVAL_MS = 1000
	const BUILTIN_MOTION_SERVICE = 'builtin'
	const BUILTIN_STEP_FIELDS: ArmStepField[] = ['position', 'orientation', 'joint', 'straight-line']
	const OTHER_STEP_FIELDS: ArmStepField[] = ['position', 'orientation', 'straight-line']

	const client = createResourceClient(
		ArmClient,
		() => partID,
		() => resourceName
	)

	const isMovingQuery = createResourceQuery(client, 'isMoving', {
		refetchInterval: POLL_INTERVAL_MS,
	})
	const propertiesQuery = createResourceQuery(client, 'getProperties')
	const supportsManualMode = $derived(propertiesQuery.data?.supportManualMode === true)
	const manualModeQuery = createResourceQuery(client, 'getManualMode', () => ({
		refetchInterval: MANUAL_MODE_REFETCH_INTERVAL_MS,
		enabled: supportsManualMode,
	}))
	// Stop is never guarded, so it sends even while a step, a hold, Zero, or Home is in flight.
	const stopMutation = createResourceMutation(client, 'stop')

	// The composed controls add their own errors through `Section.Error`, so one indicator holds every call's.
	const sectionErrors = useSectionErrors(() => ({
		queries: [isMovingQuery, propertiesQuery, manualModeQuery],
		mutations: [stopMutation],
	}))

	const motionServices = useResourceStatuses(() => partID, 'motion')
	const isBuiltin = $derived(
		moveMotionServiceName(
			motionServices.current
				.map((service) => service.name?.name)
				.filter((name): name is string => name !== undefined)
		) === BUILTIN_MOTION_SERVICE
	)

	// Every position, orientation, and joint step, each hold, Zero, and Home share one conflict group.
	const guard = createInFlightGuard()
	const steps = createArmJogSteps()

	let jog = $state<ReturnType<typeof ArmJogControl>>()
	let joints = $state<ReturnType<typeof ArmJointsControl>>()

	const isMoving = $derived(isMovingQuery.data === true)
	const isManualMode = $derived(supportsManualMode && manualModeQuery.data === true)
	const stepFields = $derived(isBuiltin ? BUILTIN_STEP_FIELDS : OTHER_STEP_FIELDS)

	const stop = () => {
		jog?.cancelHold()
		joints?.cancelHold()
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
					<div class="flex min-w-0 flex-col gap-1">
						<div
							role="group"
							aria-label="At a glance"
							class="flex min-w-0 flex-wrap items-center gap-2"
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
							{#if isManualMode}
								<span class="badge badge-warning">Manual mode</span>
							{/if}
							<StopButton onStop={stop} />
						</div>
						<p class="text-subtle-1 text-xs">Avoids configured geometry</p>
					</div>

					<!-- From `@2xl` the extra height of Joints flows into the last `1fr` row, so the left column stays packed. -->
					<div
						class="grid min-w-0 grid-cols-1 gap-3 @2xl:grid-cols-2 @2xl:grid-rows-[auto_auto_auto_1fr] @2xl:items-start @2xl:gap-x-4"
					>
						<div class="flex min-w-0 flex-col @2xl:col-start-1 @2xl:max-w-80">
							<ArmJogControl
								bind:this={jog}
								{partID}
								{resourceName}
								{guard}
								{steps}
								isEmbedded
							/>
						</div>
						{#if isBuiltin}
							<Folder
								title="Joints"
								class="min-w-0 @2xl:col-start-2 @2xl:row-span-4 @2xl:row-start-1 @2xl:max-w-80"
							>
								<ArmJointsControl
									bind:this={joints}
									{partID}
									{resourceName}
									{guard}
									{steps}
									isEmbedded
								/>
							</Folder>
						{/if}
						<div class="min-w-0 @2xl:col-start-1 @2xl:max-w-80">
							<ArmStepsFolder
								{steps}
								fields={stepFields}
							/>
						</div>
						{#if supportsManualMode}
							<Folder
								title="Manual mode"
								open={false}
								class="min-w-0 @2xl:col-start-1 @2xl:max-w-80"
							>
								<ArmManualModeControl
									{partID}
									{resourceName}
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
