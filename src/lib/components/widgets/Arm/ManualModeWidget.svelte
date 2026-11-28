<script lang="ts">
	import { ArmClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'
	import { untrack } from 'svelte'

	import { useArmState } from './arm-state.svelte'
	import ManualMode from './ManualMode.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		ArmClient,
		() => partID,
		() => resourceName
	)

	const propertiesQuery = createResourceQuery(client, 'getProperties')
	const supportsManualMode = $derived(propertiesQuery.data?.supportManualMode === true)

	const manualModeQuery = createResourceQuery(client, 'getManualMode', () => ({
		refetchInterval: 1000,
		enabled: supportsManualMode,
	}))

	const setManualModeMutation = createResourceMutation(client, 'setManualMode')

	const { manualMode: manualModeGuard } = untrack(() => useArmState(partID, resourceName))

	const setManualMode = (manualMode: boolean, enabledFor: number) => {
		void manualModeGuard.run(() => setManualModeMutation.mutateAsync([manualMode, enabledFor]))
	}
</script>

{#if supportsManualMode}
	<ApiSection
		method="SetManualMode"
		api={ResourceTriplets.Arm}
		queries={[propertiesQuery, manualModeQuery]}
		mutations={[setManualModeMutation]}
		class="grow flex-col gap-4"
	>
		<ManualMode
			isManualMode={manualModeQuery.data ?? false}
			isPending={manualModeGuard.isBusy}
			{setManualMode}
		/>
	</ApiSection>
{/if}
