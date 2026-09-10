<script lang="ts">
	import { ArmClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'

	import ManualMode from './manual-mode.svelte'

	interface Props {
		partID: string
		resourceName: string
		/** Render as a one-line band with an inline title instead of a titled ApiSection. */
		band?: boolean
	}

	const { partID, resourceName, band = false }: Props = $props()

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

	const setManualMode = (manualMode: boolean, enabledFor: number) => {
		setManualModeMutation.mutate([manualMode, enabledFor], {})
	}
</script>

{#if supportsManualMode}
	{#if band}
		<section
			aria-label="SetManualMode"
			class="border-b px-4 py-3"
		>
			<ManualMode
				title="ManualMode"
				isManualMode={manualModeQuery.data ?? false}
				isPending={setManualModeMutation.isPending}
				{setManualMode}
				lastError={setManualModeMutation.error}
			/>
		</section>
	{:else}
		<ApiSection
			title="SetManualMode"
			api="rdk:component:arm"
			class="grow"
		>
			<ManualMode
				isManualMode={manualModeQuery.data ?? false}
				isPending={setManualModeMutation.isPending}
				{setManualMode}
				lastError={setManualModeMutation.error}
			/>
		</ApiSection>
	{/if}
{/if}
