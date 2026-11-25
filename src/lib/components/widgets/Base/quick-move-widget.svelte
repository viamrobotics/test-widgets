<script lang="ts">
	import { BaseClient, MachineConnectionEvent, type Vector3 } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		useConnectionStatus,
	} from '@viamrobotics/svelte-sdk'
	import { untrack } from 'svelte'

	import { Section } from '$lib/components/section'
	import { useSectionErrors } from '$lib/components/section/use-section-errors.svelte'

	import { useBaseState } from './base-state.svelte'
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

	const { motion } = untrack(() => useBaseState(partID, resourceName))

	const isZeroPower = (linear: Vector3, angular: Vector3) =>
		[linear, angular].every(({ x, y, z }) => x === 0 && y === 0 && z === 0)

	// A zero power is a release, so it never joins the group and always sends. A drive power that
	// arrives while the group is busy is dropped, and its failure reaches the section through the mutation.
	const quickSetPower = async (linear: Vector3, angular: Vector3) => {
		if (isZeroPower(linear, angular)) {
			await quickSetPowerMutation.mutateAsync([linear, angular])
			return
		}
		await motion.run(() => quickSetPowerMutation.mutateAsync([linear, angular]))
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
