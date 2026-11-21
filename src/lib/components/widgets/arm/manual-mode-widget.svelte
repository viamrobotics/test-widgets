<script lang="ts">
	import { ArmClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { Section } from '$lib/components/section'
	import { errorKey } from '$lib/components/section/error-key'
	import { useSectionErrors } from '$lib/components/section/use-section-errors.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import ManualMode from './manual-mode.svelte'

	interface Props {
		partID: string
		resourceName: string
		/** Render as a one-line band with an inline title instead of a titled ApiSection. */
		band?: boolean
		/** Body only, inside the host's folder: no heading, errors reported to the host's section. */
		isEmbedded?: boolean
	}

	const { partID, resourceName, band = false, isEmbedded = false }: Props = $props()

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

	// The band and the embedded body render no ApiSection, so they read the same sources here.
	const bandErrors = useSectionErrors(() => ({
		queries: [propertiesQuery, manualModeQuery],
		mutations: [setManualModeMutation],
	}))

	const setManualMode = (manualMode: boolean, enabledFor: number) => {
		setManualModeMutation.mutate([manualMode, enabledFor], {})
	}
</script>

{#if supportsManualMode}
	{#if band}
		<section
			aria-label="SetManualMode"
			class="flex items-start justify-between gap-2 border-b px-4 py-3"
		>
			<ManualMode
				title="SetManualMode"
				isManualMode={manualModeQuery.data ?? false}
				isPending={setManualModeMutation.isPending}
				{setManualMode}
			/>
			<Section.Errors errors={bandErrors.errors} />
		</section>
	{:else if isEmbedded}
		{#each bandErrors.errors as error (errorKey(error))}
			<Section.Error {error} />
		{/each}
		<ManualMode
			isManualMode={manualModeQuery.data ?? false}
			isPending={setManualModeMutation.isPending}
			{setManualMode}
		/>
	{:else}
		<ApiSection
			method="SetManualMode"
			api={ResourceTriplets.Arm}
			queries={[propertiesQuery, manualModeQuery]}
			mutations={[setManualModeMutation]}
			class="grow flex-col gap-4"
		>
			<ManualMode
				isManualMode={manualModeQuery.data ?? false}
				isPending={setManualModeMutation.isPending}
				{setManualMode}
			/>
		</ApiSection>
	{/if}
{/if}
