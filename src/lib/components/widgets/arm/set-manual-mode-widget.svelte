<script lang="ts">
	import { ArmClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'

	import SetManualMode from './set-manual-mode.svelte'

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

	const properties = createResourceQuery(client, 'getProperties')
	const supported = $derived(properties.data?.supportManualMode === true)

	const query = createResourceQuery(client, 'getManualMode', () => ({
		refetchInterval: 1000,
		enabled: supported,
	}))

	const mutation = createResourceMutation(client, 'setManualMode')

	const setManualMode = (manualMode: boolean, enabledFor: number) => {
		mutation.mutate([manualMode, enabledFor], {})
	}
</script>

{#if supported}
	<ApiSection
		title="SetManualMode"
		api="rdk:component:arm"
		class="grow"
	>
		<SetManualMode
			isManualMode={query.data ?? false}
			isPending={mutation.isPending}
			{setManualMode}
		/>
	</ApiSection>
{/if}
