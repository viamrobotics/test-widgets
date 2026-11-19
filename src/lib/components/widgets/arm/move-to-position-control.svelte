<script lang="ts">
	import { Select, ToggleButtons } from '@viamrobotics/prime-controls'
	import { Banner } from '@viamrobotics/prime-ui'
	import { ArmClient, MotionClient, type Pose, type RobotClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
		createRobotQuery,
		useResourceStatuses,
		useRobotClient,
	} from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import {
		canPlanMotion,
		motionServiceOptions,
		type MoveControlMode,
		moveMotionServiceName,
	} from './move-control-mode'
	import MoveToPosition from './move-to-position.svelte'
	import { useArmMotionTracking } from './use-arm-motion-tracking.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const FRAME_SYSTEM_REFETCH_INTERVAL_MS = 5000

	const motionServices = useResourceStatuses(() => partID, 'motion')
	const motionServiceNames = $derived(
		motionServices.current
			.map((service) => service.name?.name)
			.filter((name): name is string => name !== undefined)
	)

	const robotClient = useRobotClient(() => partID)
	const frameSystemQuery = createRobotQuery(robotClient, 'frameSystemConfig', () => ({
		refetchInterval: FRAME_SYSTEM_REFETCH_INTERVAL_MS,
	}))
	const frameSystem = $derived(frameSystemQuery.data)
	const hasMotionService = $derived(motionServiceNames.length > 0)
	const motionAvailable = $derived(
		frameSystem !== undefined && canPlanMotion(motionServiceNames, frameSystem, resourceName)
	)

	const armClient = createResourceClient(
		ArmClient,
		() => partID,
		() => resourceName
	)
	// An arm that reports it cannot take direct cartesian commands can only be
	// moved through the motion service, so lock the toggle onto that mode.
	const propertiesQuery = createResourceQuery(armClient, 'getProperties')
	const cartesianUnsupported = $derived(propertiesQuery.data?.supportCartesianCommands === false)

	let userChoice = $state<MoveControlMode>()
	const preferredMode = $derived<MoveControlMode>(
		motionAvailable ? (userChoice ?? 'motion') : 'direct'
	)
	const mode = $derived<MoveControlMode>(cartesianUnsupported ? 'motion' : preferredMode)

	let userServiceChoice = $state<string>()
	const activeMotionServiceName = $derived(
		userServiceChoice ?? moveMotionServiceName(motionServiceNames)
	)
	const serviceOptions = $derived(motionServiceOptions(motionServiceNames))
	const showServiceSelect = $derived(mode === 'motion' && serviceOptions.length > 1)

	const motionClient = createResourceClient(
		MotionClient,
		() => partID,
		() => activeMotionServiceName ?? ''
	)

	const moveMutation = createResourceMutation(motionClient, 'move')
	const moveToPosMutation = createResourceMutation(armClient, 'moveToPosition')
	const activeMutation = $derived(mode === 'motion' ? moveMutation : moveToPosMutation)

	const motionTracking = useArmMotionTracking(armClient, {
		isMovePending: () => moveMutation.isPending || moveToPosMutation.isPending,
		refetchPosition: () => activeQuery.refetch(),
	})
	const refetchInterval = $derived(motionTracking.refetchInterval)

	const poseQuery = createRobotQuery(
		robotClient,
		'getPose',
		() => [resourceName, 'world', []] satisfies Parameters<RobotClient['getPose']>,
		() => ({ refetchInterval, enabled: mode === 'motion' })
	)

	const endPositionQuery = createResourceQuery(armClient, 'getEndPosition', () => ({
		refetchInterval,
		enabled: mode === 'direct',
	}))

	const activeQuery = $derived(mode === 'motion' ? poseQuery : endPositionQuery)
	const endPosition = $derived(mode === 'motion' ? poseQuery.data?.pose : endPositionQuery.data)

	const modeItems = $derived([
		{ value: 'motion', label: 'Motion service' },
		{ value: 'direct', label: 'Arm', disabled: cartesianUnsupported },
	] satisfies { value: MoveControlMode; label: string; disabled?: boolean }[])

	const serviceItems = $derived(serviceOptions.map((name) => ({ value: name, label: name })))
	const serviceLabelId = $props.id()

	const moveToPosition = (position: Pose) => {
		if (mode === 'motion') {
			moveMutation.mutate([{ referenceFrame: 'world', pose: position }, resourceName], {})
		} else {
			moveToPosMutation.mutate([position], {})
		}
	}
</script>

{#snippet description()}
	{#if mode === 'motion'}
		Pose is in the world frame, as required by the motion service.
	{:else}
		Pose is with respect to the arm origin and does not take into account the motion service or
		frame system.
	{/if}
{/snippet}

<ApiSection
	method="MoveToPosition"
	api={ResourceTriplets.Arm}
	queries={[frameSystemQuery, activeQuery]}
	mutations={[activeMutation]}
	class="grow flex-col gap-3"
>
	{#if motionAvailable}
		<ToggleButtons
			label="Control mode"
			hint="Using a motion service will include motion planning and obstacle avoidance. Direct arm control will move the arm without any planning and regardless of obstacles."
			items={modeItems}
			bind:value={
				() => mode,
				(next) => {
					userChoice = next === 'motion' ? 'motion' : 'direct'
				}
			}
		/>
	{/if}
	{#if showServiceSelect}
		<div class="flex items-center gap-2">
			<span
				id={serviceLabelId}
				class="text-subtle-1 shrink-0 text-xs"
			>
				Motion service name
			</span>
			<div class="min-w-0 flex-1">
				<Select
					items={serviceItems}
					aria-labelledby={serviceLabelId}
					bind:value={
						() => activeMotionServiceName ?? '',
						(next: string) => {
							userServiceChoice = next
						}
					}
				/>
			</div>
		</div>
	{/if}
	{#if frameSystem !== undefined}
		<Banner variant={mode === 'motion' ? 'info' : 'danger'}>
			<Banner.Description>
				{#if mode === 'motion'}
					Movement goes through motion planning and attempts to avoid obstacles.
				{:else if hasMotionService && !motionAvailable}
					{resourceName} has no frame, so the motion service cannot plan for it. The arm will not avoid
					obstacles when moving. Use with caution.
				{:else}
					The arm will not avoid obstacles when moving. Use with caution.
				{/if}
			</Banner.Description>
		</Banner>
	{/if}
	<!-- Re-seed the editor on a mode change: the two modes report the pose in different frames. -->
	{#key mode}
		{#if endPosition}
			<MoveToPosition
				{endPosition}
				{moveToPosition}
				isMoving={motionTracking.isTracking}
				{description}
			/>
		{/if}
	{/key}
</ApiSection>
