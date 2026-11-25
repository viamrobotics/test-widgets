<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { ToggleButtons } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'
	import { NavigationClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import { untrack } from 'svelte'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import { MODE_LABELS, modeFromLabel } from './navigation-mode'
	import { useNavigationState } from './navigation-state.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		NavigationClient,
		() => partID,
		() => resourceName
	)

	const mutation = createResourceMutation(client, 'setMode')
	const { mode } = untrack(() => useNavigationState(partID, resourceName))

	const items = MODE_LABELS.map((label) => ({ value: label, label }))

	let chosen = $state<string>()
	const getChosen = () => chosen
	const setChosen = (next: string | undefined) => {
		chosen = next
	}

	const chosenMode = $derived(modeFromLabel(chosen))

	const execute = () => {
		if (chosenMode === undefined) return
		void mode.run(() => mutation.mutateAsync([chosenMode]))
	}
</script>

<ApiSection
	method="SetMode"
	api={ResourceTriplets.Navigation}
	mutations={[mutation]}
	class="grow flex-col gap-2"
>
	<div class="flex w-full flex-col gap-1">
		<ToggleButtons
			label="Mode"
			{items}
			bind:value={getChosen, setChosen}
		/>
		<div class="flex justify-end">
			<button
				type="button"
				class="button button-compact"
				disabled={chosenMode === undefined || mode.isBusy}
				onclick={execute}
			>
				<Icon icon={mdiPlayCircleOutline} />
				Execute
			</button>
		</div>
	</div>
</ApiSection>
