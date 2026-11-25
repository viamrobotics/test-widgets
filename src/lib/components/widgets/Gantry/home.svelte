<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { Icon } from '@viamrobotics/prime-ui'
	import { GantryClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import { untrack } from 'svelte'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import { useGantryState } from './gantry-state.svelte'
	import HomedReadout from './homed-readout.svelte'
	import { HOMING_STATUS } from './homing-status'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		GantryClient,
		() => partID,
		() => resourceName
	)

	const homeMutation = createResourceMutation(client, 'home')

	const { motion, homing } = untrack(() => useGantryState(partID, resourceName))

	// Another Home for the same gantry also writes the shared state, so this button tracks only its own call.
	let isHoming = $state(false)

	const setHoming = (isInFlight: boolean) => {
		isHoming = isInFlight
		homing.isHoming = isInFlight
		homing.busyStatus = isInFlight ? HOMING_STATUS : ''
	}

	const home = async () => {
		const outcome = await motion.run(() => {
			setHoming(true)
			return homeMutation.mutateAsync([])
		})
		if (outcome === undefined) return
		setHoming(false)
	}
</script>

<ApiSection
	class="grow flex-col gap-4"
	method="Home"
	api={ResourceTriplets.Gantry}
	mutations={[homeMutation]}
>
	<div class="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
		<button
			type="button"
			class="button button-compact"
			aria-busy={isHoming}
			aria-disabled={motion.isBusy || undefined}
			onclick={home}
		>
			{#if isHoming}
				<span
					class="progress-dots"
					aria-hidden="true"
				></span>
			{:else}
				<Icon
					icon={mdiPlayCircleOutline}
					size="sm"
				/>
			{/if}
			Home
		</button>
		<HomedReadout isHomed={homeMutation.data} />
	</div>
</ApiSection>
