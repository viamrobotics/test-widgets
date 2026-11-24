<script lang="ts">
	import { mdiCubeOutline } from '@mdi/js'
	import { Folder } from '@viamrobotics/prime-controls'
	import { Icon, Tooltip } from '@viamrobotics/prime-ui'
	import { ArmClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
		useResourceStatuses,
	} from '@viamrobotics/svelte-sdk'

	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import { createInFlightGuard } from '$lib/components/in-flight-guard.svelte'
	import PopOut from '$lib/components/pop-out/pop-out.svelte'
	import { Section, useSectionErrors } from '$lib/components/section'
	import StopButton from '$lib/components/stop-button.svelte'

	import ArmJogControl from './arm-jog-control.svelte'
	import { createArmJogSteps } from './arm-jog-steps.svelte'
	import ArmJointsControl from './arm-joints-control.svelte'
	import { ARM_SCENE_POP_OUT_SIZE, useArmScene } from './arm-scene-context'
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
	// The pane width where the `@2xl` container query (42rem) applies. The scene goes inline from here.
	const SCENE_INLINE_MIN_WIDTH_PX = 672

	const Scene = useArmScene()

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

	let containerWidth = $state(0)
	let isPopOutOpen = $state(false)
	let sceneError = $state<Error>()

	const isSceneInline = $derived(containerWidth >= SCENE_INLINE_MIN_WIDTH_PX)

	let openSceneButton = $state<HTMLButtonElement>()
	let popOutBody = $state<HTMLDivElement>()
	let inlineSceneRegion = $state<HTMLDivElement>()
	// Plain on purpose: the focus effect below reads it only when the inline region mounts.
	let shouldFocusInlineScene = false

	const isFocusInPopOut = (): boolean => {
		const { activeElement } = document
		return activeElement === openSceneButton || !!popOutBody?.contains(activeElement)
	}

	// Widening to inline closes the pop-out for good, so narrowing again never reopens it unasked.
	const setContainerWidth = (width: number) => {
		containerWidth = width
		if (width < SCENE_INLINE_MIN_WIDTH_PX) return
		// The trigger and the window unmount, so focus that was on either moves to the inline scene.
		if (isPopOutOpen && isFocusInPopOut()) shouldFocusInlineScene = true
		isPopOutOpen = false
	}

	$effect(() => {
		if (!inlineSceneRegion || !shouldFocusInlineScene) return
		shouldFocusInlineScene = false
		inlineSceneRegion.focus()
	})

	const stop = () => {
		jog?.cancelHold()
		joints?.cancelHold()
		stopMutation.mutate([], {})
	}
</script>

{#snippet scene(SceneComponent: NonNullable<typeof Scene>)}
	<SceneComponent
		{partID}
		{resourceName}
		{isBuiltin}
		{guard}
		onError={(error) => (sceneError = error)}
	/>
{/snippet}

<ConnectionStatus {partID}>
	{#snippet connected()}
		<!-- The container sits outside the section padding, so a 672 px pane reaches `@2xl`. -->
		<div
			class="@container min-w-0"
			bind:clientWidth={null, setContainerWidth}
		>
			<Section
				errorReporter={sectionErrors}
				class="min-w-0 flex-col gap-3 p-2"
			>
				<Section.Heading class="justify-between">
					Controls
					{#snippet aside()}
						{#if Scene && !isSceneInline}
							<button
								bind:this={openSceneButton}
								type="button"
								class="button button-ghost button-xs"
								onclick={() => (isPopOutOpen = true)}
							>
								<Icon
									icon={mdiCubeOutline}
									aria-hidden="true"
								/>
								Open 3D scene
							</button>
						{/if}
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

					{#if Scene && isSceneInline}
						<div
							bind:this={inlineSceneRegion}
							role="region"
							aria-label="{resourceName} 3D scene"
							tabindex="-1"
							class="relative aspect-video min-w-0"
						>
							{@render scene(Scene)}
						</div>
					{/if}

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
				<Section.Error error={sceneError} />
			</Section>
			{#if Scene}
				<PopOut
					title={`${resourceName} › Scene`}
					minSize={ARM_SCENE_POP_OUT_SIZE}
					bind:open={isPopOutOpen}
				>
					{#snippet content()}
						<div
							bind:this={popOutBody}
							class="relative size-full"
						>
							{@render scene(Scene)}
						</div>
					{/snippet}
				</PopOut>
			{/if}
		</div>
	{/snippet}
</ConnectionStatus>
