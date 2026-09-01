<script lang="ts">
	import { Banner, Icon, Label, Select, ToggleButtons, Tooltip } from '@viamrobotics/prime-core'
	import { ArmClient, MotionClient, type Pose, type RobotClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
		createRobotQuery,
		useResourceNames,
		useRobotClient,
	} from '@viamrobotics/svelte-sdk'

	import Query from '$lib/components/query.svelte'

	import {
		defaultMoveControlMode,
		motionServiceOptions,
		type MoveControlMode,
		moveMotionServiceName,
	} from './move-control-mode'
	import MoveToPosition from './move-to-position.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const motionServices = useResourceNames(() => partID, 'motion')
	const motionServiceNames = $derived(motionServices.current.map((service) => service.name))
	const hasMotionService = $derived(motionServiceNames.length > 0)

	let userChoice = $state<MoveControlMode>()
	const mode = $derived(userChoice ?? defaultMoveControlMode(motionServiceNames))

	let userServiceChoice = $state<string>()
	const activeMotionServiceName = $derived(
		userServiceChoice ?? moveMotionServiceName(motionServiceNames)
	)
	const serviceOptions = $derived(motionServiceOptions(motionServiceNames))
	const showServiceSelect = $derived(mode === 'motion' && serviceOptions.length > 1)

	const robotClient = useRobotClient(() => partID)
	const armClient = createResourceClient(
		ArmClient,
		() => partID,
		() => resourceName
	)
	const motionClient = createResourceClient(
		MotionClient,
		() => partID,
		() => activeMotionServiceName ?? ''
	)

	// Pre-fill the editor with the arm's current pose, in the frame the active mode sends to.
	const poseArgs = $derived<Parameters<RobotClient['getPose']>>([resourceName, 'world', []])
	const poseQuery = createRobotQuery(
		robotClient,
		'getPose',
		() => poseArgs,
		() => ({ enabled: mode === 'motion' })
	)
	const endPositionQuery = createResourceQuery(armClient, 'getEndPosition', () => ({
		refetchInterval: 500,
		enabled: mode === 'direct',
	}))

	const activeQuery = $derived(mode === 'motion' ? poseQuery : endPositionQuery)
	const endPosition = $derived(mode === 'motion' ? poseQuery.data?.pose : endPositionQuery.data)

	const moveMutation = createResourceMutation(motionClient, 'move')
	const moveToPosMutation = createResourceMutation(armClient, 'moveToPosition')
	const lastError = $derived(mode === 'motion' ? moveMutation.error : moveToPosMutation.error)

	const description = $derived(
		mode === 'motion'
			? 'Pose is in the world frame, as required by the motion service.'
			: 'Pose is with respect to the arm origin and does not take into account the motion service or frame system.'
	)

	const handleModeInput = (event: CustomEvent<string>) => {
		userChoice = event.detail === 'Motion service' ? 'motion' : 'direct'
	}

	const handleServiceChange = (event: Event) => {
		if (event.target instanceof HTMLSelectElement) {
			userServiceChoice = event.target.value
		}
	}

	const moveToPosition = (position: Pose) => {
		if (mode === 'motion') {
			moveMutation.mutate([{ referenceFrame: 'world', pose: position }, resourceName], {})
		} else {
			moveToPosMutation.mutate([position], {})
		}
	}
</script>

<div class="flex flex-col gap-4">
	{#if hasMotionService}
		<Label position="top">
			<span class="flex items-center gap-1 text-xs">
				Control mode
				<Tooltip>
					<Icon
						name="information-outline"
						size="sm"
					/>
					<span slot="description">
						Using a motion service will include motion planning and obstacle avoidance. Direct arm
						control will move the arm without any planning and regardless of obstacles.
					</span>
				</Tooltip>
			</span>

			<ToggleButtons
				slot="input"
				options={['Motion service', 'Arm']}
				selected={mode === 'motion' ? 'Motion service' : 'Arm'}
				on:input={handleModeInput}
			/>
		</Label>
	{/if}
	{#if showServiceSelect}
		<Label>
			Motion service name

			<Select
				slot="input"
				value={activeMotionServiceName ?? ''}
				on:change={handleServiceChange}
			>
				{#each serviceOptions as name (name)}
					<option value={name}>{name}</option>
				{/each}
			</Select>
		</Label>
	{/if}
	<Banner variant={mode === 'motion' ? 'info' : 'danger'}>
		{#snippet subtitle()}
			{#if mode === 'motion'}
				Movement goes through motion planning and attempts to avoid obstacles.
			{:else}
				The arm will not avoid obstacles when moving. Use with caution.
			{/if}
		{/snippet}
	</Banner>
	<Query query={activeQuery}>
		{#if endPosition}
			<MoveToPosition
				{endPosition}
				{moveToPosition}
				{lastError}
				{description}
			/>
		{/if}
	</Query>
</div>
