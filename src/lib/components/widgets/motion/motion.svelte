<script lang="ts">
	import { createRobotQuery, useRobotClient } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import ConnectionStatus from '$lib/components/connection-status.svelte'

	import FrameSelect from './frame-select.svelte'
	import { movableFrameNames, parentFrame, referenceFrameNames } from './frame-system-config'
	import MoveWidget from './move-widget.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const robotClient = useRobotClient(() => partID)
	const frameSystem = createRobotQuery(robotClient, 'frameSystemConfig', () => ({
		refetchInterval: 5000,
	}))

	const frameNames = $derived(movableFrameNames(frameSystem.data))
	const destinationOptions = $derived(referenceFrameNames(frameSystem.data))

	let selectedFrame = $state<string>()
	const frameName = $derived(selectedFrame ?? frameNames[0] ?? '')

	let selectedDestination = $state<string>()
	const destination = $derived(selectedDestination ?? parentFrame(frameSystem.data, frameName))
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<ApiSection
			title="Move"
			api="rdk:service:motion"
		>
			<div class="flex min-w-0 flex-col gap-4">
				<FrameSelect
					label="Component"
					value={frameName}
					options={frameNames}
					onChange={(value) => {
						selectedFrame = value
						// reset the destination to the newly selected frame's parent
						selectedDestination = undefined
					}}
				/>
				<FrameSelect
					label="Destination frame"
					value={destination}
					options={destinationOptions}
					onChange={(value) => {
						selectedDestination = value
					}}
				/>
				<MoveWidget
					{partID}
					{resourceName}
					{frameName}
					{destination}
				/>
			</div>
		</ApiSection>
	{/snippet}
</ConnectionStatus>
