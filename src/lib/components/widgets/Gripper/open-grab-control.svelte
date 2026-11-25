<script lang="ts">
	import { GripperClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import { untrack } from 'svelte'

	import { Section, useSectionErrors } from '$lib/components/section'
	import StatusLine from '$lib/components/status-line.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import { useGripperState } from './gripper-state.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	type Action = 'open' | 'grab'

	const client = createResourceClient(
		GripperClient,
		() => partID,
		() => resourceName
	)

	const openMutation = createResourceMutation(client, 'open')
	const grabMutation = createResourceMutation(client, 'grab')

	const sectionErrors = useSectionErrors(() => ({
		mutations: [openMutation, grabMutation],
	}))

	const { motion } = untrack(() => useGripperState(partID, resourceName))

	let activeAction = $state<Action | undefined>()
	let statusText = $state('')

	const isOpenBusy = $derived(motion.isBusy && activeAction === 'open')
	const isGrabBusy = $derived(motion.isBusy && activeAction === 'grab')

	const open = async () => {
		const outcome = await motion.run(() => {
			activeAction = 'open'
			statusText = 'Opening'
			return openMutation.mutateAsync([])
		})
		if (outcome === undefined) return
		statusText = outcome === 'succeeded' ? 'Opened' : ''
	}

	const grab = async () => {
		const outcome = await motion.run(() => {
			activeAction = 'grab'
			statusText = 'Grabbing'
			return grabMutation.mutateAsync([])
		})
		if (outcome === undefined) return
		// The SDK's Grab resolves with no value, so whether it closed on something is the Holding badge's to say.
		statusText = outcome === 'succeeded' ? 'Grab finished' : ''
	}
</script>

{#snippet controls()}
	<Section.Body>
		<div class="flex w-full min-w-0 flex-col gap-1">
			<div
				role="group"
				aria-label="Open and Grab"
				class="flex flex-wrap items-center gap-x-2 gap-y-1.5"
			>
				<button
					type="button"
					class="button button-xs"
					aria-busy={isOpenBusy}
					disabled={motion.isBusy && !isOpenBusy}
					aria-disabled={isOpenBusy ? true : undefined}
					onclick={open}
				>
					{#if isOpenBusy}
						<span
							class="progress-dots"
							aria-hidden="true"
						></span>
					{/if}
					Open
				</button>
				<button
					type="button"
					class="button button-xs"
					aria-busy={isGrabBusy}
					disabled={motion.isBusy && !isGrabBusy}
					aria-disabled={isGrabBusy ? true : undefined}
					onclick={grab}
				>
					{#if isGrabBusy}
						<span
							class="progress-dots"
							aria-hidden="true"
						></span>
					{/if}
					Grab
				</button>
			</div>
			<StatusLine text={statusText} />
		</div>
	</Section.Body>
{/snippet}

<Section
	errorReporter={sectionErrors}
	class="flex-col gap-3"
>
	<Section.Heading>
		<Section.Method
			method="Open"
			api={ResourceTriplets.Gripper}
		/>
		<span>/</span>
		<Section.Method
			method="Grab"
			api={ResourceTriplets.Gripper}
		/>
		{#snippet aside()}
			<Section.Errors errors={sectionErrors.errors} />
		{/snippet}
	</Section.Heading>
	{@render controls()}
</Section>
