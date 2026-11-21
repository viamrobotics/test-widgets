<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { Icon } from '@viamrobotics/prime-ui'
	import { GantryClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { createInFlightGuard, type InFlightGuard } from '$lib/components/in-flight-guard.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import HomedReadout from './homed-readout.svelte'

	interface Props {
		partID: string
		resourceName: string
		/**
		 * The conflict group's guard, shared with the host's jogs, so Home and a step are never in
		 * flight together. Without it, the widget makes its own.
		 */
		guard?: InFlightGuard
		/** True while this widget's Home call is in flight. Bind it to name the call elsewhere. */
		isHoming?: boolean
	}

	let { partID, resourceName, guard: hostGuard, isHoming = $bindable(false) }: Props = $props()

	const client = createResourceClient(
		GantryClient,
		() => partID,
		() => resourceName
	)

	const homeMutation = createResourceMutation(client, 'home')

	const ownGuard = createInFlightGuard()
	const guard = $derived(hostGuard ?? ownGuard)

	const home = async () => {
		const outcome = await guard.run(() => {
			isHoming = true
			return homeMutation.mutateAsync([])
		})
		if (outcome === undefined) return
		isHoming = false
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
			aria-disabled={guard.isBusy || undefined}
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
