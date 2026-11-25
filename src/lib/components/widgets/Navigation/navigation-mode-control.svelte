<script lang="ts">
	import { ToggleButtons } from '@viamrobotics/prime-controls'
	import { navigationApi, NavigationClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'
	import { untrack } from 'svelte'

	import { Section, useSectionErrors } from '$lib/components/section'

	import { modeFromLabel, modeLabel } from './navigation-mode'
	import { useNavigationState } from './navigation-state.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const MODE_REFETCH_INTERVAL_MS = 10_000

	const client = createResourceClient(
		NavigationClient,
		() => partID,
		() => resourceName
	)

	const getModeQuery = createResourceQuery(client, 'getMode', {
		refetchInterval: MODE_REFETCH_INTERVAL_MS,
	})
	const setModeMutation = createResourceMutation(client, 'setMode')

	// Shares the `mode` group with every SetMode widget on this service, so a press while any mode
	// change is pending is dropped, never queued.
	const { mode } = untrack(() => useNavigationState(partID, resourceName))

	/**
	 * Explore mode is hidden due to being slated for removal.
	 * Do not enable it, Rand's well-being and happiness are at stake.
	 */
	const MODE_ITEMS = [navigationApi.Mode.MANUAL, navigationApi.Mode.WAYPOINT].map((item) => ({
		value: modeLabel(item),
		label: modeLabel(item),
	}))

	const getMode = () => modeLabel(getModeQuery.data)

	const commitMode = async (label: string | undefined) => {
		const nextMode = modeFromLabel(label)
		if (nextMode === undefined) return

		const outcome = await mode.run(() => setModeMutation.mutateAsync([nextMode]))
		if (outcome === 'succeeded') await getModeQuery.refetch()
	}

	const selectMode = (label: string | undefined) => {
		void commitMode(label)
	}

	const sectionErrors = useSectionErrors(() => ({
		queries: [getModeQuery],
		mutations: [setModeMutation],
	}))
</script>

<Section
	errorReporter={sectionErrors}
	class="flex-col gap-2"
>
	<Section.Heading>
		Mode
		{#snippet aside()}
			<Section.Errors errors={sectionErrors.errors} />
		{/snippet}
	</Section.Heading>

	<Section.Body>
		<div
			class="flex items-end gap-2"
			aria-busy={mode.isBusy}
		>
			<ToggleButtons
				label="Mode"
				items={MODE_ITEMS}
				disabled={mode.isBusy}
				bind:value={getMode, selectMode}
			/>
			{#if mode.isBusy}
				<span
					class="progress-dots mb-2"
					aria-hidden="true"
				></span>
			{/if}
		</div>
	</Section.Body>
</Section>
