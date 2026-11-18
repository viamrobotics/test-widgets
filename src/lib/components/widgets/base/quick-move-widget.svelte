<script lang="ts">
	import { BaseClient, MachineConnectionEvent, type Vector3 } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		useConnectionStatus,
	} from '@viamrobotics/svelte-sdk'

	import { Section } from '$lib/components/section'
	import { useSectionErrors } from '$lib/components/section/use-section-errors.svelte'

	import QuickMove from './quick-move.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		BaseClient,
		() => partID,
		() => resourceName
	)

	const connectionStatus = useConnectionStatus(() => partID)
	const isConnected = $derived(connectionStatus.current === MachineConnectionEvent.CONNECTED)

	const quickSetPowerMutation = createResourceMutation(client, 'setPower')
	const stopMutation = createResourceMutation(client, 'stop')

	const quickSetPower = (linear: Vector3, angular: Vector3) => {
		quickSetPowerMutation.mutate([linear, angular], {})
	}

	const stop = () => {
		stopMutation.mutate([], {})
	}

	const sectionErrors = useSectionErrors(() => ({
		mutations: [quickSetPowerMutation, stopMutation],
	}))
</script>

<Section
	errorReporter={sectionErrors}
	class="flex-col gap-2"
>
	<Section.Heading>
		Quick move
		{#snippet aside()}
			<Section.Errors errors={sectionErrors.errors} />
		{/snippet}
	</Section.Heading>

	<Section.Body>
		<QuickMove
			setPower={quickSetPower}
			{stop}
			{isConnected}
		/>
	</Section.Body>
</Section>
